# Guia de Desenvolvimento

## Estrutura do Projeto

```
project-root/
├── apps/
│   ├── web/              # Frontend Next.js
│   └── api/              # Backend NestJS
├── packages/
│   ├── ui/               # Componentes compartilhados
│   ├── config/           # Configurações (ESLint, TS)
│   ├── types/            # Tipos TypeScript
│   └── utils/            # Utilitários
├── docker/               # Configurações Docker
├── docs/                 # Documentação
└── turbo.json            # Configuração Turborepo
```

---

## Fluxo de Desenvolvimento

### 1. Criar Nova Feature

```bash
# 1. Criar branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# 2. Desenvolver...

# 3. Commit seguindo conventional commits
git add .
git commit -m "feat(module): descrição da feature"

# 4. Push e criar PR
git push origin feature/nome-da-feature
```

### 2. Conventional Commits

| Tipo     | Descrição                           |
|----------|-------------------------------------|
| `feat`   | Nova funcionalidade                 |
| `fix`    | Correção de bug                     |
| `docs`   | Documentação                        |
| `style`  | Formatação (não afeta código)       |
| `refactor` | Refatoração                       |
| `test`   | Adição/modificação de testes        |
| `chore`  | Tarefas de manutenção               |

**Exemplos:**
```bash
feat(auth): add JWT refresh token
fix(users): correct email validation
docs(api): update swagger descriptions
refactor(products): extract price calculation
```

---

## Frontend (Next.js)

### Estrutura de Componentes

```typescript
// components/features/users/UserCard/UserCard.tsx
'use client';

import { cn } from '@/lib/utils';
import { User } from '@/types';

interface UserCardProps {
  user: User;
  className?: string;
  onEdit?: (user: User) => void;
}

export function UserCard({ user, className, onEdit }: UserCardProps) {
  return (
    <div className={cn('p-4 rounded-lg border', className)}>
      <h3 className="font-semibold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Editar</button>
      )}
    </div>
  );
}
```

### Hooks Customizados

```typescript
// hooks/queries/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services';

export const userKeys = {
  all: ['users'] as const,
  list: (filters?: object) => [...userKeys.all, 'list', filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

export function useUsers(filters?: object) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersService.getAll(filters),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
```

### Server vs Client Components

```typescript
// ✅ Server Component (padrão) - Fetch de dados
// app/users/page.tsx
export default async function UsersPage() {
  const users = await fetchUsers();
  return <UserList users={users} />;
}

// ✅ Client Component - Interatividade
// components/UserList.tsx
'use client';

export function UserList({ users }: Props) {
  const [search, setSearch] = useState('');
  // ... interatividade
}
```

---

## Backend (NestJS)

### Criando um Novo Módulo

```bash
# Usando CLI do Nest
pnpm --filter api nest g module modules/products
pnpm --filter api nest g controller modules/products
pnpm --filter api nest g service modules/products
```

### Estrutura de um Módulo

```typescript
// modules/products/products.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### Controller

```typescript
// modules/products/products.controller.ts
@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  findAll(@Query() pagination: PaginationDto) {
    return this.productsService.findAll(pagination);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar produto' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

### Service

```typescript
// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(pagination: PaginationDto) {
    const [data, total] = await this.productRepository.findAndCount({
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      data,
      meta: { page: pagination.page, limit: pagination.limit, total },
    };
  }

  async create(dto: CreateProductDto) {
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }
}
```

### DTO com Validação

```typescript
// modules/products/dto/create-product.dto.ts
export class CreateProductDto {
  @ApiProperty({ example: 'Produto X' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 99.90 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
```

---

## Database (TypeORM)

### Criar Migration

```bash
# Gerar migration automaticamente (baseado em entidades)
pnpm --filter api migration:generate --name=CreateProductsTable

# Criar migration vazia (manual)
pnpm --filter api migration:create --name=AddColumnToProducts
```

### Entity

```typescript
// modules/products/entities/product.entity.ts
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## Testes

### Frontend

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend

```typescript
// modules/products/products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('should create a product', async () => {
    mockRepository.create.mockReturnValue(mockProduct);
    mockRepository.save.mockResolvedValue(mockProduct);

    const result = await service.create(createDto);

    expect(result).toEqual(mockProduct);
  });
});
```

### Executar Testes

```bash
# Todos os testes
pnpm test

# Com coverage
pnpm test:cov

# Watch mode
pnpm test:watch

# E2E (backend)
pnpm --filter api test:e2e
```

---

## Debugging

### VS Code - Launch Configurations

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "sourceMaps": true
    },
    {
      "name": "Debug Web",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/web"
    }
  ]
}
```

### Backend com Debug

```bash
# Inicia com inspector
pnpm --filter api start:debug
```

---

## Boas Práticas

### ✅ Fazer

- Usar TypeScript estrito
- Escrever testes para features críticas
- Documentar APIs com Swagger
- Usar DTOs para validação
- Seguir conventional commits
- Code review em PRs

### ❌ Evitar

- `any` types
- Console.log em produção
- Commits diretos em main/develop
- Dependências desnecessárias
- Código duplicado
- Secrets em código

---

## Comandos Rápidos

```bash
# Desenvolvimento
pnpm dev                    # Inicia tudo
pnpm --filter web dev       # Só frontend
pnpm --filter api dev       # Só backend

# Build
pnpm build                  # Build tudo
pnpm build --filter=web     # Build específico

# Testes
pnpm test                   # Testes unitários
pnpm test:e2e               # Testes E2E

# Lint
pnpm lint                   # Lint tudo
pnpm lint --fix             # Auto-fix

# Types
pnpm type-check             # Verifica tipos
```

---

## Próximos Passos

- [Guia de Deploy](./DEPLOYMENT.md)
- [Arquitetura](../architecture/README.md)
- [ADRs](../architecture/adr/)
