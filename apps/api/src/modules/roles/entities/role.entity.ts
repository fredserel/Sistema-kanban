import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean; // System roles cannot be edited

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // Relationships

  // Role hierarchy
  @ManyToOne(() => Role, (role) => role.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Role;

  @OneToMany(() => Role, (role) => role.parent)
  children: Role[];

  // Role permissions
  @ManyToMany(() => Permission, (permission) => permission.roles, {
    eager: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  // Users with this role
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  // Helper methods

  /**
   * Check if role has a specific permission
   */
  hasPermission(permissionSlug: string): boolean {
    return this.permissions?.some((p) => p.slug === permissionSlug) ?? false;
  }

  /**
   * Get all permissions (including inherited)
   */
  getAllPermissions(): Permission[] {
    const permissions = [...(this.permissions || [])];

    if (this.parent) {
      permissions.push(...this.parent.getAllPermissions());
    }

    // Remove duplicates
    return [...new Map(permissions.map((p) => [p.id, p])).values()];
  }
}
