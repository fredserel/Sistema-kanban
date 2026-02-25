import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'List all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @Permissions('roles.read')
  @ApiOperation({ summary: 'List permissions grouped by resource' })
  findAllGrouped() {
    return this.permissionsService.findAllGrouped();
  }
}
