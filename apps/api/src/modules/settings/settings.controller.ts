import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings (super admin only)' })
  async findAll(@CurrentUser() user: any) {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Apenas super administradores podem acessar configuracoes');
    }
    return this.settingsService.getAll();
  }

  @Put()
  @ApiOperation({ summary: 'Update settings (super admin only)' })
  async update(
    @Body() data: { settings: { key: string; value: string }[] },
    @CurrentUser() user: any,
  ) {
    if (!user.isSuperAdmin) {
      throw new ForbiddenException('Apenas super administradores podem alterar configuracoes');
    }
    await this.settingsService.bulkUpdate(data.settings);
    return { message: 'Configuracoes atualizadas com sucesso' };
  }
}
