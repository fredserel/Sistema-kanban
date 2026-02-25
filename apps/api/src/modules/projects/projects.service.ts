import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Project, StageName, Priority } from './entities/project.entity';
import { ProjectStage, StageStatus } from './entities/project-stage.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

const STAGE_ORDER: StageName[] = [
  StageName.NAO_INICIADO,
  StageName.MODELAGEM_NEGOCIO,
  StageName.MODELAGEM_TI,
  StageName.DESENVOLVIMENTO,
  StageName.HOMOLOGACAO,
  StageName.FINALIZADO,
];

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectStage)
    private readonly stageRepository: Repository<ProjectStage>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async create(data: {
    title: string;
    description?: string;
    priority?: Priority;
    ownerId: string;
  }): Promise<Project> {
    const project = this.projectRepository.create({
      ...data,
      priority: data.priority || Priority.MEDIUM,
      currentStage: StageName.NAO_INICIADO,
    });

    const savedProject = await this.projectRepository.save(project);

    // Create all 6 stages
    const stages = STAGE_ORDER.map((stageName) =>
      this.stageRepository.create({
        projectId: savedProject.id,
        stageName,
        status: stageName === StageName.NAO_INICIADO ? StageStatus.IN_PROGRESS : StageStatus.PENDING,
      }),
    );

    await this.stageRepository.save(stages);

    this.logger.log(`Project created: ${savedProject.id}`);

    return this.findOne(savedProject.id);
  }

  async findAll(filters?: {
    ownerId?: string;
    priority?: Priority;
    currentStage?: StageName;
    search?: string;
  }): Promise<Project[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.stages', 'stages')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .where('project.deletedAt IS NULL');

    if (filters?.ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId: filters.ownerId });
    }

    if (filters?.priority) {
      queryBuilder.andWhere('project.priority = :priority', { priority: filters.priority });
    }

    if (filters?.currentStage) {
      queryBuilder.andWhere('project.currentStage = :currentStage', { currentStage: filters.currentStage });
    }

    if (filters?.search) {
      queryBuilder.andWhere('(project.title LIKE :search OR project.description LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    return queryBuilder.orderBy('project.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'stages', 'members', 'members.user', 'comments', 'comments.user'],
    });

    if (!project) {
      throw new NotFoundException(`Project #${id} not found`);
    }

    return project;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, data);
    await this.projectRepository.save(project);
    return this.findOne(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.findOne(id);
    await this.projectRepository.softDelete(id);
    this.logger.log(`Project soft deleted: ${id}`);
  }

  async findDeleted(): Promise<Project[]> {
    return this.projectRepository.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['owner'],
    });
  }

  async restore(id: string): Promise<Project> {
    await this.projectRepository.restore(id);
    return this.findOne(id);
  }

  async permanentDelete(id: string): Promise<void> {
    await this.projectRepository.delete(id);
    this.logger.log(`Project permanently deleted: ${id}`);
  }

  async addMember(projectId: string, userId: string, addedById: string): Promise<ProjectMember> {
    const project = await this.findOne(projectId);

    const member = this.memberRepository.create({ projectId, userId });
    const saved = await this.memberRepository.save(member);

    // Send email notification (non-blocking)
    this.notifyMemberAdded(project, userId, addedById).catch(() => {});

    return saved;
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.memberRepository.delete({ projectId, userId });
  }

  async addComment(projectId: string, userId: string, content: string): Promise<Comment> {
    const project = await this.findOne(projectId);

    const comment = this.commentRepository.create({ projectId, userId, content });
    const saved = await this.commentRepository.save(comment);

    // Send email notification (non-blocking)
    this.notifyCommentAdded(project, userId, content).catch(() => {});

    return saved;
  }

  // ── Email helpers ─────────────────────────────────────────────────

  private async getProjectRecipientEmails(project: Project, excludeUserId?: string): Promise<string[]> {
    const userIds = new Set<string>();

    // Owner
    if (project.ownerId) userIds.add(project.ownerId);

    // Members
    if (project.members) {
      for (const m of project.members) {
        userIds.add(m.userId);
      }
    }

    // Exclude the user who triggered the action
    if (excludeUserId) userIds.delete(excludeUserId);

    if (userIds.size === 0) return [];

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.email')
      .whereInIds([...userIds])
      .andWhere('user.isActive = true')
      .getMany();

    return users.map((u) => u.email);
  }

  private async notifyMemberAdded(project: Project, addedUserId: string, addedById: string): Promise<void> {
    const [addedUser, addedBy] = await Promise.all([
      this.userRepository.findOne({ where: { id: addedUserId }, select: ['id', 'name', 'email'] }),
      this.userRepository.findOne({ where: { id: addedById }, select: ['id', 'name'] }),
    ]);

    if (!addedUser || !addedBy) return;

    const recipientEmails = await this.getProjectRecipientEmails(project, addedById);
    // Also include the newly added user
    if (!recipientEmails.includes(addedUser.email)) {
      recipientEmails.push(addedUser.email);
    }

    if (recipientEmails.length === 0) return;

    await this.mailService.notifyMemberAdded({
      projectTitle: project.title,
      addedUserName: addedUser.name,
      addedByName: addedBy.name,
      recipientEmails,
    });
  }

  private async notifyCommentAdded(project: Project, authorId: string, content: string): Promise<void> {
    const author = await this.userRepository.findOne({ where: { id: authorId }, select: ['id', 'name'] });
    if (!author) return;

    const recipientEmails = await this.getProjectRecipientEmails(project, authorId);
    if (recipientEmails.length === 0) return;

    await this.mailService.notifyCommentAdded({
      projectTitle: project.title,
      commentAuthorName: author.name,
      commentContent: content,
      recipientEmails,
    });
  }
}
