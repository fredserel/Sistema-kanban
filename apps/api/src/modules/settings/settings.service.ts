import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

const DEFAULT_SETTINGS: Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // AWS SES
  {
    key: 'ses_aws_region',
    value: '',
    group: 'email',
    label: 'AWS Region',
    description: 'Regiao AWS do SES (ex: us-east-1, sa-east-1)',
    encrypted: false,
  },
  {
    key: 'ses_access_key_id',
    value: '',
    group: 'email',
    label: 'Access Key ID',
    description: 'AWS Access Key ID para autenticacao no SES',
    encrypted: false,
  },
  {
    key: 'ses_secret_access_key',
    value: '',
    group: 'email',
    label: 'Secret Access Key',
    description: 'AWS Secret Access Key para autenticacao no SES',
    encrypted: true,
  },
  {
    key: 'ses_from_email',
    value: 'noreply@conectenvios.com.br',
    group: 'email',
    label: 'E-mail Remetente',
    description: 'Endereco de e-mail verificado no SES para envio',
    encrypted: false,
  },
  // General
  {
    key: 'app_name',
    value: 'Conectenvios Kanban',
    group: 'general',
    label: 'Nome da Aplicacao',
    description: 'Nome exibido nos e-mails e no sistema',
    encrypted: false,
  },
  {
    key: 'app_url',
    value: 'http://localhost:3000',
    group: 'general',
    label: 'URL da Aplicacao',
    description: 'URL base da aplicacao (usada nos links dos e-mails)',
    encrypted: false,
  },
];

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, string | null>();

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
    await this.refreshCache();
  }

  private async seedDefaults(): Promise<void> {
    for (const def of DEFAULT_SETTINGS) {
      const existing = await this.settingRepository.findOne({ where: { key: def.key } });
      if (!existing) {
        await this.settingRepository.save(this.settingRepository.create(def));
      } else {
        // Update label/description if changed, but keep the value
        existing.label = def.label;
        existing.description = def.description;
        existing.group = def.group;
        existing.encrypted = def.encrypted;
        await this.settingRepository.save(existing);
      }
    }
    this.logger.log(`Settings initialized (${DEFAULT_SETTINGS.length} keys)`);
  }

  private async refreshCache(): Promise<void> {
    const all = await this.settingRepository.find();
    this.cache.clear();
    for (const s of all) {
      this.cache.set(s.key, s.value);
    }
  }

  get(key: string, fallback = ''): string {
    return this.cache.get(key) || fallback;
  }

  async getAll(): Promise<Setting[]> {
    const settings = await this.settingRepository.find({ order: { group: 'ASC', key: 'ASC' } });
    // Mask encrypted values for API response
    return settings.map((s) => ({
      ...s,
      value: s.encrypted && s.value ? '••••••••' : s.value,
    }));
  }

  async getByGroup(group: string): Promise<Setting[]> {
    const settings = await this.settingRepository.find({
      where: { group },
      order: { key: 'ASC' },
    });
    return settings.map((s) => ({
      ...s,
      value: s.encrypted && s.value ? '••••••••' : s.value,
    }));
  }

  async bulkUpdate(updates: { key: string; value: string }[]): Promise<void> {
    for (const { key, value } of updates) {
      const setting = await this.settingRepository.findOne({ where: { key } });
      if (!setting) continue;

      // Skip if encrypted field sent as masked placeholder
      if (setting.encrypted && value === '••••••••') continue;

      setting.value = value;
      await this.settingRepository.save(setting);
    }

    await this.refreshCache();
    this.logger.log(`Settings updated: ${updates.map((u) => u.key).join(', ')}`);
  }
}
