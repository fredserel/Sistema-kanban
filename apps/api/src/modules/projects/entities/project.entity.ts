import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectStage } from './project-stage.entity';
import { ProjectMember } from './project-member.entity';
import { Comment } from './comment.entity';
import { Priority, StageName } from './enums';

export { Priority, StageName };

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({
    name: 'current_stage',
    type: 'enum',
    enum: StageName,
    default: StageName.NAO_INICIADO,
  })
  @Index()
  currentStage: StageName;

  @Column({ name: 'owner_id' })
  @Index()
  ownerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relationships

  @ManyToOne(() => User, (user) => user.ownedProjects)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => ProjectStage, (stage) => stage.project, { cascade: true })
  stages: ProjectStage[];

  @OneToMany(() => ProjectMember, (member) => member.project, { cascade: true })
  members: ProjectMember[];

  @OneToMany(() => Comment, (comment) => comment.project, { cascade: true })
  comments: Comment[];
}
