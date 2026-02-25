import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from './project.entity';
import { StageName, StageStatus } from './enums';

export { StageStatus };

@Entity('project_stages')
@Unique(['projectId', 'stageName'])
export class ProjectStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @Column({
    name: 'stage_name',
    type: 'enum',
    enum: StageName,
  })
  stageName: StageName;

  @Column({
    type: 'enum',
    enum: StageStatus,
    default: StageStatus.PENDING,
  })
  status: StageStatus;

  @Column({ name: 'planned_start_date', type: 'datetime', nullable: true })
  plannedStartDate: Date | null;

  @Column({ name: 'planned_end_date', type: 'datetime', nullable: true })
  plannedEndDate: Date | null;

  @Column({ name: 'actual_start_date', type: 'datetime', nullable: true })
  actualStartDate: Date | null;

  @Column({ name: 'actual_end_date', type: 'datetime', nullable: true })
  actualEndDate: Date | null;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason: string | null;

  @Column({ name: 'blocked_at', type: 'datetime', nullable: true })
  blockedAt: Date | null;

  @Column({ name: 'blocked_by_id', nullable: true })
  blockedById: string | null;

  // Relationships

  @ManyToOne(() => Project, (project) => project.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blocked_by_id' })
  blockedBy: User;
}
