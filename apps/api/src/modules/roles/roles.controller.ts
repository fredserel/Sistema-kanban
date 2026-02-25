import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'List roles with user counts' })
  findAll() {
    return this.rolesService.findAllWithUserCount();
  }

  @Get(':id')
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Create role' })
  create(@Body() data: { name: string; slug: string; description?: string; permissionIds?: string[] }) {
    return this.rolesService.create(data);
  }

  @Put(':id')
  @Permissions('roles.manage')
  @ApiOperation({ summary: 'Update role' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { name?: string; description?: string; permissionIds?: string[]; isActive?: boolean },
  ) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  @Permissions('roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
