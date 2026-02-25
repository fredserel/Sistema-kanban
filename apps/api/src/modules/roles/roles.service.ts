import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll() {
    return this.roleRepository.find({
      relations: ['permissions', 'parent'],
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findAllWithUserCount() {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoin('role.users', 'user')
      .addSelect('COUNT(DISTINCT user.id)', 'userCount')
      .where('role.isActive = :isActive', { isActive: true })
      .andWhere('role.deletedAt IS NULL')
      .groupBy('role.id')
      .addGroupBy('permission.id')
      .orderBy('role.name', 'ASC')
      .getRawAndEntities();

    // Build a map of role ID -> user count from raw results
    const userCountMap: Record<string, number> = {};
    for (const raw of roles.raw) {
      const roleId = raw.role_id;
      const count = parseInt(raw.userCount, 10) || 0;
      userCountMap[roleId] = count;
    }

    return roles.entities.map((role) => ({
      ...role,
      userCount: userCountMap[role.id] || 0,
    }));
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions', 'parent', 'children'],
    });

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    return role;
  }

  async findBySlug(slug: string) {
    return this.roleRepository.findOne({
      where: { slug },
      relations: ['permissions'],
    });
  }

  async create(data: { name: string; slug: string; description?: string; permissionIds?: string[] }) {
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw new ConflictException(`Role with slug '${data.slug}' already exists`);
    }

    let permissions: Permission[] = [];
    if (data.permissionIds?.length) {
      permissions = await this.permissionRepository.find({
        where: { id: In(data.permissionIds) },
      });
    }

    const role = this.roleRepository.create({
      ...data,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async update(id: string, data: { name?: string; description?: string; permissionIds?: string[]; isActive?: boolean }) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be edited');
    }

    if (data.permissionIds !== undefined) {
      role.permissions = await this.permissionRepository.find({
        where: { id: In(data.permissionIds) },
      });
    }

    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  async remove(id: string) {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    await this.roleRepository.softDelete(id);
  }
}
