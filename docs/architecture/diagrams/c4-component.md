# C4 Model - Diagrama de Componentes

## Nível 3: Componentes do Backend

O diagrama de componentes detalha a estrutura interna do container Backend (NestJS),
mostrando os módulos e suas interações.

### Diagrama de Componentes - Backend

```mermaid
C4Component
    title Componentes do Backend (NestJS)

    Container_Boundary(api, "Backend API") {
        Component(auth, "Auth Module", "NestJS Module", "Autenticação e autorização JWT")
        Component(users, "Users Module", "NestJS Module", "Gerenciamento de usuários")
        Component(products, "Products Module", "NestJS Module", "Gerenciamento de produtos")
        Component(orders, "Orders Module", "NestJS Module", "Gerenciamento de pedidos")
        Component(common, "Common Module", "NestJS Module", "Guards, Interceptors, Filters")
        Component(config, "Config Module", "NestJS Module", "Configurações da aplicação")
        Component(database, "Database Module", "TypeORM", "Conexão com banco de dados")
    }

    ContainerDb(db, "MariaDB", "Database")
    Container_Ext(frontend, "Frontend", "Next.js")

    Rel(frontend, auth, "Login/Register", "HTTP")
    Rel(frontend, users, "CRUD usuários", "HTTP")
    Rel(frontend, products, "CRUD produtos", "HTTP")
    Rel(frontend, orders, "CRUD pedidos", "HTTP")

    Rel(auth, users, "Valida usuário")
    Rel(users, database, "Persiste dados")
    Rel(products, database, "Persiste dados")
    Rel(orders, database, "Persiste dados")
    Rel(database, db, "SQL", "TCP")
```

---

## Estrutura Detalhada dos Módulos

### Auth Module

```
┌──────────────────────────────────────────────────────────────┐
│                        AUTH MODULE                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  AuthController │    │   AuthService   │                 │
│  │                 │───▶│                 │                 │
│  │  POST /login    │    │  validateUser() │                 │
│  │  POST /register │    │  login()        │                 │
│  │  POST /refresh  │    │  register()     │                 │
│  │  POST /logout   │    │  refreshToken() │                 │
│  └─────────────────┘    └────────┬────────┘                 │
│                                  │                           │
│         ┌────────────────────────┼────────────────────┐     │
│         ▼                        ▼                    ▼     │
│  ┌─────────────┐    ┌────────────────┐    ┌──────────────┐ │
│  │   JwtStrategy  │    │ LocalStrategy  │    │ JwtRefresh │ │
│  │             │    │              │    │   Strategy   │ │
│  └─────────────┘    └────────────────┘    └──────────────┘ │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      GUARDS                            │  │
│  │  JwtAuthGuard  │  LocalAuthGuard  │  RolesGuard       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Users Module

```
┌──────────────────────────────────────────────────────────────┐
│                       USERS MODULE                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ UsersController │    │  UsersService   │                 │
│  │                 │───▶│                 │                 │
│  │  GET    /users  │    │  findAll()      │                 │
│  │  GET    /users/:id│   │  findOne()      │                 │
│  │  POST   /users  │    │  create()       │                 │
│  │  PUT    /users/:id│   │  update()       │                 │
│  │  DELETE /users/:id│   │  remove()       │                 │
│  └─────────────────┘    └────────┬────────┘                 │
│                                  │                           │
│                                  ▼                           │
│                      ┌─────────────────┐                    │
│                      │ UsersRepository │                    │
│                      │                 │                    │
│                      │  Custom queries │                    │
│                      │  Pagination     │                    │
│                      └────────┬────────┘                    │
│                               │                              │
│                               ▼                              │
│                      ┌─────────────────┐                    │
│                      │   User Entity   │                    │
│                      │                 │                    │
│                      │  id, name       │                    │
│                      │  email, role    │                    │
│                      │  password       │                    │
│                      └─────────────────┘                    │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                        DTOs                            │  │
│  │  CreateUserDto  │  UpdateUserDto  │  UserResponseDto  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Common Module

```
┌──────────────────────────────────────────────────────────────┐
│                       COMMON MODULE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      GUARDS                            │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │JwtAuthGuard │  │ RolesGuard  │  │ThrottleGuard│   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   INTERCEPTORS                         │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  Transform  │  │  Logging    │  │  Timeout    │   │  │
│  │  │ Interceptor │  │ Interceptor │  │ Interceptor │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     FILTERS                            │  │
│  │                                                        │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐   │  │
│  │  │HttpExceptionFilter│  │AllExceptionsFilter     │   │  │
│  │  └─────────────────┘  └──────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    DECORATORS                          │  │
│  │                                                        │  │
│  │  @CurrentUser()  │  @Roles()  │  @Public()            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      PIPES                             │  │
│  │                                                        │  │
│  │  ValidationPipe  │  ParseUUIDPipe  │  ParseIntPipe    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Fluxo de uma Requisição

```
┌─────────┐     ┌───────────┐     ┌────────┐     ┌─────────┐     ┌──────────┐
│ Request │────▶│  Guards   │────▶│  Pipes │────▶│Controller│────▶│ Service  │
└─────────┘     └───────────┘     └────────┘     └─────────┘     └────┬─────┘
                                                                      │
                ┌───────────┐     ┌────────┐     ┌─────────┐          │
                │ Response  │◀────│Intercept│◀────│ Filters │◀─────────┘
                └───────────┘     └────────┘     └─────────┘

1. Guards: Verifica autenticação/autorização
2. Pipes: Valida e transforma dados de entrada
3. Controller: Recebe request, delega para service
4. Service: Executa lógica de negócio
5. Filters: Captura e trata exceções
6. Interceptors: Transforma response
```

---

## Próximo Documento

→ [Data Flow](./data-flow.md) - Diagramas de fluxo de dados
