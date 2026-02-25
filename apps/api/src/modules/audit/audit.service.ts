import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: unknown;
    newValue?: unknown;
  }): Promise<AuditLog> {
    const log = this.auditRepository.create({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : undefined,
      newValue: data.newValue ? JSON.stringify(data.newValue) : undefined,
    });

    return this.auditRepository.save(log);
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditRepository.find({
      where: { entityType, entityId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
