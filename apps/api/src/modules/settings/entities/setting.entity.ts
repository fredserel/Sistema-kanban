import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @Column({ length: 50, default: 'general' })
  @Index()
  group: string;

  @Column({ length: 200, nullable: true })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  encrypted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
