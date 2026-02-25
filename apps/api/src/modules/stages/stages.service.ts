import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectStage, StageStatus } from '../projects/entities/project-stage.entity';
import { Project, StageName } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { MailService } from '../mail/mail.service';

const STAGE_ORDER: StageName[] = [
  StageName.NAO_INICIADO,
  StageName.MODELAGEM_NEGOCIO,
  StageName.MODELAGEM_TI,
  StageName.DESENVOLVIMENTO,
  StageName.HOMOLOGACAO,
  StageName.FINALIZADO,
];

const STAGE_LABELS: Record<StageName, string> = {
  [StageName.NAO_INICIADO]: 'Nao Iniciado',
  [StageName.MODELAGEM_NEGOCIO]: 'Modelagem Negocio',
  [StageName.MODELAGEM_TI]: 'Modelagem TI',
  [StageName.DESENVOLVIMENTO]: 'Desenvolvimento',
  [StageName.HOMOLOGACAO]: 'Homologacao',
  [StageName.FINALIZADO]: 'Finalizado',
};

@Injectable()
export class StagesService {
  private readonly logger = new Logger(StagesService.name);

  constructor(
    @InjectRepository(ProjectStage)
    private readonly stageRepository: Repository<ProjectStage>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    private readonly mailService: MailService,
  ) {}

  async findByProject(projectId: string): Promise<ProjectStage[]> {
    return this.stageRepository.find({
      where: { projectId },
      order: { stageName: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProjectStage> {
    const stage = await this.stageRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!stage) {
      throw new NotFoundException(`Stage #${id} not found`);
    }

    return stage;
  }

  async update(id: string, data: {
    plannedStartDate?: Date;
    plannedEndDate?: Date;
  }): Promise<ProjectStage> {
    const stage = await this.findOne(id);
    Object.assign(stage, data);
    return this.stageRepository.save(stage);
  }

  async complete(id: string, userId: string): Promise<ProjectStage> {
    const stage = await this.findOne(id);

    if (stage.status === StageStatus.BLOCKED) {
      throw new BadRequestException('Cannot complete a blocked stage');
    }

    if (stage.status === StageStatus.COMPLETED) {
      throw new BadRequestException('Stage is already completed');
    }

    // Mark as completed
    await this.stageRepository.update(id, {
      status: StageStatus.COMPLETED,
      actualEndDate: new Date(),
    });

    // Advance to next stage
    const currentIndex = STAGE_ORDER.indexOf(stage.stageName);
    if (currentIndex < STAGE_ORDER.length - 1) {
      const nextStageName = STAGE_ORDER[currentIndex + 1];

      // Find the next stage directly
      const nextStage = await this.stageRepository.findOne({
        where: { projectId: stage.projectId, stageName: nextStageName },
      });

      if (nextStage) {
        await this.stageRepository.update(nextStage.id, {
          status: StageStatus.IN_PROGRESS,
          actualStartDate: new Date(),
        });
      }

      // Update project current stage (without loading stages relation)
      await this.projectRepository.update(stage.projectId, {
        currentStage: nextStageName,
      });
    }

    this.logger.log(`Stage completed: ${id} by user ${userId}`);
    return this.findOne(id);
  }

  async block(id: string, reason: string, userId: string): Promise<ProjectStage> {
    const stage = await this.findOne(id);

    stage.status = StageStatus.BLOCKED;
    stage.blockReason = reason;
    stage.blockedAt = new Date();
    stage.blockedById = userId;

    this.logger.log(`Stage blocked: ${id} by user ${userId}`);
    return this.stageRepository.save(stage);
  }

  async unblock(id: string, userId: string): Promise<ProjectStage> {
    const stage = await this.findOne(id);

    if (stage.status !== StageStatus.BLOCKED) {
      throw new BadRequestException('Stage is not blocked');
    }

    stage.status = StageStatus.IN_PROGRESS;
    stage.blockReason = null;
    stage.blockedAt = null;
    stage.blockedById = null;

    this.logger.log(`Stage unblocked: ${id} by user ${userId}`);
    return this.stageRepository.save(stage);
  }

  async moveToStage(
    projectId: string,
    targetStage: StageName,
    userId: string,
    justification?: string,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['stages'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const previousStage = project.currentStage;
    const currentIndex = STAGE_ORDER.indexOf(project.currentStage);
    const targetIndex = STAGE_ORDER.indexOf(targetStage);

    // Going backwards requires justification
    if (targetIndex < currentIndex && !justification) {
      throw new BadRequestException('Justification required to go back');
    }

    // Update stages
    for (const stage of project.stages) {
      const stageIndex = STAGE_ORDER.indexOf(stage.stageName);

      if (stageIndex < targetIndex) {
        stage.status = StageStatus.COMPLETED;
      } else if (stageIndex === targetIndex) {
        stage.status = StageStatus.IN_PROGRESS;
        stage.actualStartDate = new Date();
      } else {
        stage.status = StageStatus.PENDING;
      }
    }

    await this.stageRepository.save(project.stages);

    // Update project
    project.currentStage = targetStage;
    await this.projectRepository.save(project);

    this.logger.log(`Project ${projectId} moved to ${targetStage} by ${userId}`);

    // Send email notification (non-blocking)
    this.notifyProjectMoved(project, previousStage, targetStage, userId).catch(() => {});

    return project;
  }

  // ── Email helpers ─────────────────────────────────────────────────

  private async getProjectRecipientEmails(projectId: string, ownerId: string, excludeUserId?: string): Promise<string[]> {
    const userIds = new Set<string>();
    userIds.add(ownerId);

    const members = await this.memberRepository.find({ where: { projectId } });
    for (const m of members) {
      userIds.add(m.userId);
    }

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

  private async notifyProjectMoved(
    project: Project,
    fromStage: StageName,
    toStage: StageName,
    movedById: string,
  ): Promise<void> {
    const movedBy = await this.userRepository.findOne({ where: { id: movedById }, select: ['id', 'name'] });
    if (!movedBy) return;

    const recipientEmails = await this.getProjectRecipientEmails(project.id, project.ownerId, movedById);
    if (recipientEmails.length === 0) return;

    await this.mailService.notifyProjectMoved({
      projectTitle: project.title,
      fromStage: STAGE_LABELS[fromStage] || fromStage,
      toStage: STAGE_LABELS[toStage] || toStage,
      movedByName: movedBy.name,
      recipientEmails,
    });
  }
}
