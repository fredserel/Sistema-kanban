import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { StagesService } from './stages.service';
import { StageName } from '../projects/entities/project.entity';

@ApiTags('stages')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Get('projects/:projectId/stages')
  @Permissions('projects.read')
  @ApiOperation({ summary: 'Get project stages' })
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.stagesService.findByProject(projectId);
  }

  @Put('stages/:id')
  @Permissions('stages.update')
  @ApiOperation({ summary: 'Update stage dates' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { plannedStartDate?: Date; plannedEndDate?: Date },
  ) {
    return this.stagesService.update(id, data);
  }

  @Post('stages/:id/complete')
  @Permissions('stages.complete')
  @ApiOperation({ summary: 'Complete stage' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.complete(id, userId);
  }

  @Post('stages/:id/block')
  @Permissions('stages.block')
  @ApiOperation({ summary: 'Block stage' })
  block(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.block(id, reason, userId);
  }

  @Post('stages/:id/unblock')
  @Permissions('stages.block')
  @ApiOperation({ summary: 'Unblock stage' })
  unblock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.unblock(id, userId);
  }

  @Post('projects/:projectId/move')
  @Permissions('stages.update')
  @ApiOperation({ summary: 'Move project to stage' })
  moveToStage(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('targetStage') targetStage: StageName,
    @Body('justification') justification: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.moveToStage(projectId, targetStage, userId, justification);
  }
}
