import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { Priority, StageName } from './entities/project.entity';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Permissions('projects.create')
  @ApiOperation({ summary: 'Create project' })
  create(
    @Body() data: { title: string; description?: string; priority?: Priority },
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.create({ ...data, ownerId: userId });
  }

  @Get()
  @Permissions('projects.read', 'kanban.view')
  @ApiOperation({ summary: 'List projects' })
  findAll(
    @Query('ownerId') ownerId?: string,
    @Query('priority') priority?: Priority,
    @Query('currentStage') currentStage?: StageName,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findAll({ ownerId, priority, currentStage, search });
  }

  @Get('trash')
  @Permissions('projects.delete')
  @ApiOperation({ summary: 'List deleted projects' })
  findDeleted() {
    return this.projectsService.findDeleted();
  }

  @Get(':id')
  @Permissions('projects.read')
  @ApiOperation({ summary: 'Get project by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @Permissions('projects.update')
  @ApiOperation({ summary: 'Update project' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { title?: string; description?: string; priority?: Priority },
  ) {
    return this.projectsService.update(id, data);
  }

  @Delete(':id')
  @Permissions('projects.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete project' })
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.softDelete(id);
  }

  @Post(':id/restore')
  @Permissions('projects.delete')
  @ApiOperation({ summary: 'Restore deleted project' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.restore(id);
  }

  @Delete(':id/permanent')
  @Permissions('projects.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete project' })
  permanentDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.permanentDelete(id);
  }

  @Post(':id/members')
  @Permissions('projects.update')
  @ApiOperation({ summary: 'Add member to project' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.projectsService.addMember(id, userId, currentUserId);
  }

  @Delete(':id/members/:userId')
  @Permissions('projects.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from project' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.projectsService.removeMember(id, userId);
  }

  @Post(':id/comments')
  @Permissions('projects.read')
  @ApiOperation({ summary: 'Add comment to project' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.addComment(id, userId, content);
  }
}
