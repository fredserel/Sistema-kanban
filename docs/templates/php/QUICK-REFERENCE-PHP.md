# Quick Reference - Stack PHP Laravel

> Cartão de referência rápida para consulta durante desenvolvimento.

---

## Stack Resumida

```
┌─────────────────────────────────────────────────────────────┐
│                    LARAVEL 11 + INERTIA.JS                  │
├─────────────────────────────┬───────────────────────────────┤
│         BACKEND             │          FRONTEND             │
│         (Laravel)           │        (Inertia+Vue)          │
├─────────────────────────────┼───────────────────────────────┤
│ PHP 8.3                     │ Vue 3 (Composition API)       │
│ Eloquent ORM                │ TypeScript                    │
│ Laravel Sanctum             │ Inertia.js                    │
│ Spatie Permission           │ shadcn-vue                    │
│ Form Requests               │ TailwindCSS                   │
│ API Resources               │ Vite                          │
│ Amazon SES                  │ Lucide Icons                  │
│ Laravel Queue               │ VueUse                        │
├─────────────────────────────┴───────────────────────────────┤
│  🌍 IDIOMAS: pt-BR (principal) │ en (secundário) │ es (futuro)│
├─────────────────────────────────────────────────────────────┤
│                    INFRAESTRUTURA                           │
│  MariaDB 10.11  │  Redis 7  │  Nginx  │  Docker Compose     │
└─────────────────────────────────────────────────────────────┘
```

---

## Comandos Essenciais

| Ação                    | Comando                                    |
|-------------------------|--------------------------------------------|
| Servidor dev            | `php artisan serve`                        |
| Frontend dev            | `npm run dev`                              |
| Docker up               | `docker-compose up -d`                     |
| Migrate                 | `php artisan migrate`                      |
| Fresh + Seed            | `php artisan migrate:fresh --seed`         |
| Criar Model completo    | `php artisan make:model Product -mfsc`     |
| Criar Controller        | `php artisan make:controller XController -r` |
| Criar Request           | `php artisan make:request StoreXRequest`   |
| Criar Resource          | `php artisan make:resource XResource`      |
| Queue worker            | `php artisan queue:work`                   |
| Cache clear             | `php artisan cache:clear`                  |
| Code style              | `./vendor/bin/pint`                        |
| Static analysis         | `./vendor/bin/phpstan analyse`             |

---

## Estrutura de Pastas

```
laravel-project/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # Controllers
│   │   ├── Requests/        # Form Requests (validação)
│   │   ├── Resources/       # API Resources
│   │   └── Middleware/
│   ├── Models/              # Eloquent Models
│   ├── Services/            # Business Logic
│   └── Enums/
│
├── resources/js/
│   ├── Pages/               # Páginas Inertia (Vue)
│   ├── Components/ui/       # shadcn-vue
│   ├── Layouts/             # Layouts Vue
│   └── Composables/         # Vue Composables
│
├── lang/
│   ├── pt-BR/               # Traduções PT
│   └── en/                  # Traduções EN
│
├── routes/
│   ├── web.php              # Rotas web (Inertia)
│   └── api.php              # Rotas API
│
└── docker/
```

---

## Padrões de Código

### Controller (Resource)

```php
class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => UserResource::collection(User::paginate()),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->create($request->validated());
        return redirect()->route('users.index')->with('success', __('Created'));
    }
}
```

### Form Request

```php
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.create');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
        ];
    }
}
```

### API Resource

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'roles' => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
        ];
    }
}
```

### Service

```php
class UserService
{
    public function create(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->syncRoles($data['roles'] ?? []);

        return $user;
    }
}
```

### Vue Page (Inertia)

```vue
<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';

defineProps<{
    users: App.Data.User[];
}>();
</script>

<template>
    <Head title="Usuários" />
    <AuthenticatedLayout>
        <h1>{{ $page.props.translations['Users'] }}</h1>
    </AuthenticatedLayout>
</template>
```

---

## Portas Padrão

| Serviço   | Porta |
|-----------|-------|
| Nginx     | 80    |
| PHP-FPM   | 9000  |
| MariaDB   | 3306  |
| Redis     | 6379  |
| Vite HMR  | 5173  |

---

## Variáveis de Ambiente

```env
# App
APP_LOCALE=pt-BR
APP_FALLBACK_LOCALE=en

# Database
DB_CONNECTION=mariadb
DB_HOST=mariadb
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# AWS SES
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
```

---

## i18n Quick Reference

### Idiomas

| Código  | Idioma     | Status   |
|---------|------------|----------|
| `pt-BR` | Português  | Principal|
| `en`    | English    | Secundário|
| `es`    | Español    | Futuro   |

### Backend (Laravel)

```php
// Tradução simples
__('Users')  // "Usuários" ou "Users"

// Com placeholder
__('Welcome, :name', ['name' => 'João'])

// Pluralização
trans_choice('messages.items', $count)
```

### Frontend (Inertia)

```vue
<!-- Via props compartilhadas -->
{{ $page.props.translations['Users'] }}

<!-- Via helper (se configurado) -->
{{ __('Users') }}
```

---

## Permissões (Spatie)

```php
// Verificar permissão
$user->can('users.create');
$user->hasRole('admin');

// Middleware em rotas
Route::middleware(['permission:users.view'])->get('/users', ...);

// No Form Request
public function authorize(): bool
{
    return $this->user()->can('users.create');
}
```

```vue
<!-- No Vue (via props) -->
<button v-if="$page.props.auth.permissions.includes('users.create')">
    Novo Usuário
</button>
```

---

## Artisan Make Commands

```bash
# Model completo (migration, factory, seeder, controller)
php artisan make:model Product -mfsc

# Controller resource
php artisan make:controller ProductController --resource --model=Product

# Form Request
php artisan make:request Product/StoreProductRequest

# API Resource
php artisan make:resource ProductResource
php artisan make:resource ProductCollection

# Service (manual ou via package)
php artisan make:class Services/ProductService

# Enum
php artisan make:enum ProductStatus

# Policy
php artisan make:policy ProductPolicy --model=Product
```

---

**v1.0.0 | Fevereiro 2026**
