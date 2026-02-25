# Arquitetura Backend - NestJS 10 + Fastify

## 1. Visão Geral

O backend é construído com NestJS 10 utilizando **Fastify** como adaptador HTTP (ao invés do
Express padrão). Fastify é um framework web de alta performance, oferecendo throughput
significativamente maior e menor overhead.

### 1.1 Por que Fastify?

| Característica     | Express          | Fastify           |
|--------------------|------------------|-------------------|
| Requests/segundo   | ~15.000          | ~30.000+          |
| Overhead           | Alto             | Baixo             |
| Validação          | Middleware       | JSON Schema       |
| Hooks              | Limitado         | Ciclo completo    |
| TypeScript         | Parcial          | First-class       |
| Plugins            | Middleware       | Encapsulamento    |

### 1.2 Características Principais

- **Alta Performance**: Fastify é até 2x mais rápido que Express
- **Modular**: Organização em módulos independentes NestJS
- **Injeção de Dependências**: Container IoC nativo
- **Decorators**: Metaprogramação para código declarativo
- **TypeScript First**: Tipagem estrita em toda a aplicação
- **Testável**: Arquitetura que facilita testes unitários e E2E
- **Schema Validation**: Validação JSON Schema nativa do Fastify

---

## 2. Estrutura de Diretórios

```
apps/api/
├── src/
│   ├── main.ts                       # Bootstrap da aplicação
│   ├── app.module.ts                 # Módulo raiz
│   │
│   ├── config/                       # Configurações
│   │   ├── configuration.ts          # Variáveis de ambiente
│   │   ├── database.config.ts        # Config do TypeORM
│   │   ├── jwt.config.ts             # Config JWT
│   │   └── swagger.config.ts         # Config OpenAPI
│   │
│   ├── common/                       # Código compartilhado
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   │
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   │
│   │   └── interfaces/
│   │       ├── response.interface.ts
│   │       └── paginated.interface.ts
│   │
│   ├── modules/                      # Módulos de domínio
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       ├── update-user.dto.ts
│   │   │       └── user-response.dto.ts
│   │   │
│   │   └── [domain]/                 # Outros módulos de domínio
│   │       ├── [domain].module.ts
│   │       ├── [domain].controller.ts
│   │       ├── [domain].service.ts
│   │       ├── [domain].repository.ts
│   │       ├── entities/
│   │       └── dto/
│   │
│   └── database/
│       ├── database.module.ts
│       ├── migrations/
│       │   └── 1707660000000-CreateUsersTable.ts
│       └── seeds/
│           └── user.seed.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## 3. Conceitos Fundamentais do NestJS

### 3.1 Módulos

```typescript
// modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Registra entidade
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Exporta para outros módulos
})
export class UsersModule {}
```

### 3.2 Controllers

```typescript
// modules/users/users.controller.ts
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
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { UserRole } from './enums/user-role.enum';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // CREATE
  // ============================================
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email já existe',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  // ============================================
  // READ (Lista paginada)
  // ============================================
  @Get()
  @ApiOperation({ summary: 'Listar usuários' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuários',
  })
  async findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  // ============================================
  // READ (Por ID)
  // ============================================
  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  // ============================================
  // UPDATE
  // ============================================
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário atualizado',
    type: UserResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  // ============================================
  // DELETE
  // ============================================
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover usuário' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Usuário removido',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.remove(id);
  }

  // ============================================
  // PROFILE (Usuário atual)
  // ============================================
  @Get('me/profile')
  @ApiOperation({ summary: 'Obter perfil do usuário atual' })
  async getProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
    return this.usersService.findOne(user.id);
  }
}
```

### 3.3 Services

```typescript
// modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { PaginatedResponse } from '@/common/interfaces/paginated.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // ============================================
  // CREATE
  // ============================================
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, ...rest } = createUserDto;

    // Verifica se email já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário
    const user = this.usersRepository.create({
      ...rest,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(`Usuário criado: ${savedUser.id}`);

    return this.toResponseDto(savedUser);
  }

  // ============================================
  // READ (Lista paginada)
  // ============================================
  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const { page = 1, limit = 10, search } = pagination;
    const skip = (page - 1) * limit;

    // Condições de busca
    const where: FindOptionsWhere<User>[] = [];
    if (search) {
      where.push(
        { name: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
      );
    }

    // Query
    const [users, total] = await this.usersRepository.findAndCount({
      where: where.length ? where : undefined,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map(this.toResponseDto),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // READ (Por ID)
  // ============================================
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    return this.toResponseDto(user);
  }

  // ============================================
  // READ (Por Email - interno)
  // ============================================
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  // ============================================
  // UPDATE
  // ============================================
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    // Se está atualizando senha, faz hash
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Atualiza
    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);

    this.logger.log(`Usuário atualizado: ${id}`);

    return this.toResponseDto(updatedUser);
  }

  // ============================================
  // DELETE
  // ============================================
  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    await this.usersRepository.softDelete(id);
    this.logger.log(`Usuário removido (soft delete): ${id}`);
  }

  // ============================================
  // HELPERS
  // ============================================
  private toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

---

## 4. DTOs e Validação

### 4.1 DTOs com Class Validator

```typescript
// modules/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário',
  })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    example: 'joao@email.com',
    description: 'Email do usuário (único)',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha (min 8 chars, 1 maiúscula, 1 minúscula, 1 número)',
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/,
    { message: 'Senha deve conter maiúscula, minúscula e número' }
  )
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.USER,
    description: 'Papel do usuário no sistema',
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role inválido' })
  role?: UserRole;
}
```

```typescript
// modules/users/dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Herda de CreateUserDto, torna todos campos opcionais
// Remove email (não pode ser alterado após criação)
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const)
) {}
```

```typescript
// modules/users/dto/user-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-v4' })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### 4.2 DTO de Paginação

```typescript
// common/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## 5. Entidades TypeORM

```typescript
// modules/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  @Exclude() // Não serializa em responses
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // ============================================
  // HOOKS
  // ============================================
  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    this.email = this.email?.toLowerCase().trim();
  }
}
```

```typescript
// modules/users/enums/user-role.enum.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
}
```

---

## 6. Interceptors, Filters e Guards

### 6.1 Transform Interceptor (Resposta Padronizada)

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### 6.2 HTTP Exception Filter (Fastify)

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        details = (exceptionResponse as any).details;
      } else {
        message = exceptionResponse;
      }
    }

    // Log do erro
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Resposta padronizada (Fastify usa .code() ao invés de .status())
    response.code(status).send({
      success: false,
      error: {
        statusCode: status,
        message,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

### 6.3 Logging Interceptor

```typescript
// common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    this.logger.log(`→ ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(`← ${method} ${url} ${response.statusCode} +${delay}ms`);
      }),
    );
  }
}
```

### 6.4 JWT Auth Guard

```typescript
// common/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado');
    }
    return user;
  }
}
```

### 6.5 Roles Guard

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@/modules/users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não tem roles definidos, permite acesso
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    return requiredRoles.some((role) => user?.role === role);
  }
}
```

---

## 7. Decorators Customizados

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

// Uso: @CurrentUser() user ou @CurrentUser('id') userId
```

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/modules/users/enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Uso: @Roles(UserRole.ADMIN, UserRole.MANAGER)
```

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Uso: @Public() - marca rota como pública (sem autenticação)
```

---

## 8. Configuração da Aplicação

### 8.1 Main.ts (Fastify Adapter)

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // ============================================
  // CRIAR APP COM FASTIFY ADAPTER
  // ============================================
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Usa o logger do NestJS
      trustProxy: true, // Para proxies reversos (Nginx, etc.)
    }),
    {
      logger: ['error', 'warn', 'log', 'debug'],
    },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ============================================
  // SEGURANÇA (Fastify Helmet)
  // ============================================
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
      },
    },
  });

  // ============================================
  // CORS (Fastify CORS)
  // ============================================
  await app.register(require('@fastify/cors'), {
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ============================================
  // COMPRESSÃO (Fastify Compress)
  // ============================================
  await app.register(require('@fastify/compress'), {
    encodings: ['gzip', 'deflate'],
  });

  // ============================================
  // PREFIXO GLOBAL
  // ============================================
  app.setGlobalPrefix('api/v1');

  // ============================================
  // PIPES GLOBAIS
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Remove propriedades não declaradas
      forbidNonWhitelisted: true, // Erro se propriedades não declaradas
      transform: true,            // Transforma tipos automaticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // FILTERS GLOBAIS
  // ============================================
  app.useGlobalFilters(new AllExceptionsFilter());

  // ============================================
  // INTERCEPTORS GLOBAIS
  // ============================================
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ============================================
  // SWAGGER (apenas desenvolvimento)
  // ============================================
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('Documentação da API REST')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Endpoints de autenticação')
      .addTag('users', 'Gerenciamento de usuários')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger disponível em: http://localhost:${port}/api/docs`);
  }

  // ============================================
  // INICIAR SERVIDOR
  // ============================================
  // Fastify requer '0.0.0.0' para aceitar conexões externas (Docker)
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Fastify rodando em: http://localhost:${port}`);
  logger.log(`Ambiente: ${nodeEnv}`);
}

bootstrap();
```

### 8.2 App Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // ============================================
    // CONFIGURAÇÃO
    // ============================================
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // ============================================
    // RATE LIMITING
    // ============================================
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1 minuto
        limit: 100,  // 100 requisições
      },
    ]),

    // ============================================
    // DATABASE
    // ============================================
    DatabaseModule,

    // ============================================
    // MÓDULOS DE DOMÍNIO
    // ============================================
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
```

### 8.3 Configuração de Ambiente

```typescript
// config/configuration.ts
export default () => ({
  // Servidor
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'app_db',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
});
```

---

## 9. Testes

### 9.1 Teste Unitário de Service

```typescript
// modules/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@email.com',
    password: 'hashedPassword',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('deve retornar um usuário quando encontrado', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('deve lançar NotFoundException quando usuário não existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar um novo usuário', async () => {
      mockRepository.findOne.mockResolvedValue(null); // Email não existe
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'Test User',
        email: 'test@email.com',
        password: 'Password123',
      });

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se email já existe', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'Test User',
          email: 'test@email.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
```

### 9.2 Teste E2E

```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin123' });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/users', () => {
    it('deve retornar lista de usuários', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });
  });
});
```

---

## 10. Boas Práticas

### 10.1 Checklist de Desenvolvimento

- [ ] Usar DTOs para validação de entrada
- [ ] Documentar endpoints com Swagger decorators
- [ ] Implementar tratamento de erros consistente
- [ ] Usar transactions para operações múltiplas
- [ ] Implementar logging estruturado
- [ ] Escrever testes unitários e E2E
- [ ] Usar variáveis de ambiente para configurações
- [ ] Implementar rate limiting
- [ ] Validar dados de entrada com class-validator

### 10.2 Padrões de Código

| Padrão               | Descrição                                      |
|----------------------|------------------------------------------------|
| Repository Pattern   | Abstração de acesso a dados                    |
| DTO Pattern          | Objetos de transferência de dados              |
| Dependency Injection | Injeção de dependências via constructor        |
| Guard Pattern        | Proteção de rotas                              |
| Interceptor Pattern  | Processamento de request/response              |
| Filter Pattern       | Tratamento de exceções                         |

---

## 11. Dependências Fastify

### 11.1 Pacotes Necessários

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/platform-fastify": "^10.x",
    "@nestjs/config": "^3.x",
    "@nestjs/typeorm": "^10.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@nestjs/throttler": "^5.x",
    "@fastify/helmet": "^11.x",
    "@fastify/compress": "^7.x",
    "@fastify/cors": "^9.x",
    "@fastify/static": "^7.x",
    "fastify": "^4.x",
    "typeorm": "^0.3.x",
    "mariadb": "^3.x",
    "passport": "^0.7.x",
    "passport-jwt": "^4.x",
    "passport-local": "^1.x",
    "bcrypt": "^5.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/bcrypt": "^5.x",
    "@types/passport-jwt": "^4.x",
    "@types/passport-local": "^1.x",
    "typescript": "^5.x"
  }
}
```

### 11.2 Diferenças Express vs Fastify

| Aspecto              | Express                   | Fastify                        |
|----------------------|---------------------------|--------------------------------|
| Tipos Request        | `import { Request }`      | `import { FastifyRequest }`    |
| Tipos Response       | `import { Response }`     | `import { FastifyReply }`      |
| Status code          | `res.status(200)`         | `res.code(200)`                |
| Middleware           | `app.use()`               | `app.register()`               |
| Helmet               | `helmet`                  | `@fastify/helmet`              |
| Compression          | `compression`             | `@fastify/compress`            |
| CORS                 | `cors`                    | `@fastify/cors`                |
| Static files         | `express.static()`        | `@fastify/static`              |

### 11.3 Instalação

```bash
# Remover dependências Express (se existirem)
pnpm remove @nestjs/platform-express express @types/express

# Instalar dependências Fastify
pnpm add @nestjs/platform-fastify fastify
pnpm add @fastify/helmet @fastify/compress @fastify/cors @fastify/static
```

---

## Próximos Documentos

- [Banco de Dados](./04-BANCO-DE-DADOS.md) - TypeORM e MariaDB
- [Autenticação](./05-AUTENTICACAO.md) - JWT + Passport
- [Infraestrutura](./06-INFRAESTRUTURA.md) - Docker e deploy

---

## Histórico de Revisões

| Data       | Versão | Autor        | Descrição                          |
|------------|--------|--------------|-----------------------------------|
| 2026-02-11 | 1.0.0  | Arquiteto    | Versão inicial                    |
| 2026-02-11 | 1.1.0  | Arquiteto    | Migração para Fastify adapter     |
