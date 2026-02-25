import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { Project } from '../../projects/entities/project.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { Comment } from '../../projects/entities/comment.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_super_admin', default: false })
  isSuperAdmin: boolean; // Bypass all permissions

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin: Date | null;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  // Relationships

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  // Hooks

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // Permission methods

  /**
   * Get all user permissions (from all roles)
   */
  getPermissions(): Permission[] {
    if (!this.roles) return [];

    const allPermissions: Permission[] = [];

    for (const role of this.roles) {
      if (role.isActive) {
        allPermissions.push(...role.getAllPermissions());
      }
    }

    // Remove duplicates
    return [...new Map(allPermissions.map((p) => [p.id, p])).values()];
  }

  /**
   * Get permission slugs for guards
   */
  getPermissionSlugs(): string[] {
    return this.getPermissions().map((p) => p.slug);
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permissionSlug: string): boolean {
    if (this.isSuperAdmin) return true;
    return this.getPermissionSlugs().includes(permissionSlug);
  }

  /**
   * Check if user has ALL specified permissions
   */
  hasAllPermissions(permissionSlugs: string[]): boolean {
    if (this.isSuperAdmin) return true;
    const userPermissions = this.getPermissionSlugs();
    return permissionSlugs.every((slug) => userPermissions.includes(slug));
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  hasAnyPermission(permissionSlugs: string[]): boolean {
    if (this.isSuperAdmin) return true;
    const userPermissions = this.getPermissionSlugs();
    return permissionSlugs.some((slug) => userPermissions.includes(slug));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleSlug: string): boolean {
    return this.roles?.some((r) => r.slug === roleSlug && r.isActive) ?? false;
  }
}
