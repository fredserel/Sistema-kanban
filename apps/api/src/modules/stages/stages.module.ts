import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectStage } from '../projects/entities/project-stage.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { User } from '../users/entities/user.entity';
import { StagesService } from './stages.service';
import { StagesController } from './stages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectStage, Project, ProjectMember, User])],
  controllers: [StagesController],
  providers: [StagesService],
  exports: [StagesService],
})
export class StagesModule {}
