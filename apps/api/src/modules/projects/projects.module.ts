import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectStage } from './entities/project-stage.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectStage, ProjectMember, Comment, User]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
