# Template de Stack PHP - Laravel + Inertia.js

> Template padrão para iniciar novos projetos PHP com stack unificada.
> **Última atualização**: Fevereiro 2026

---

## Stack Tecnológico Oficial

| Camada      | Tecnologia                   | Versão     |
|-------------|------------------------------|------------|
| Linguagem   | PHP                          | 8.3+       |
| Framework   | Laravel                      | 11.x       |
| ORM         | Eloquent                     | -          |
| Auth        | Laravel Sanctum              | 4.x        |
| RBAC        | Spatie Permission            | 6.x        |
| Frontend    | Inertia.js + Vue 3           | 1.x / 3.x  |
| UI          | shadcn-vue + TailwindCSS     | -          |
| TypeScript  | TypeScript                   | 5.x        |
| Build       | Vite                         | 5.x        |
| Database    | MariaDB                      | 10.11      |
| Cache/Queue | Redis                        | 7.x        |
| E-mail      | Amazon SES                   | -          |
| Web Server  | Nginx + PHP-FPM              | -          |
| Container   | Docker Compose               | 3.8        |

### Idiomas Suportados

| Código  | Idioma     | Status       |
|---------|------------|--------------|
| `pt-BR` | Português  | ✅ Principal  |
| `en`    | English    | ✅ Secundário |
| `es`    | Español    | 🔜 Futuro     |

---

## Quick Start

### 1. Criar Projeto Laravel

```bash
# Criar projeto Laravel
composer create-project laravel/laravel meu-projeto
cd meu-projeto

# Instalar Inertia.js (Vue)
composer require inertiajs/inertia-laravel
php artisan inertia:middleware

# Frontend
npm install @inertiajs/vue3 vue @vitejs/plugin-vue
npm install -D typescript vue-tsc
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Instalar Dependências Adicionais

```bash
# Backend
composer require laravel/sanctum
composer require spatie/laravel-permission
composer require aws/aws-sdk-php

# Publicar configs
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Frontend
npm install @vueuse/core
npm install radix-vue class-variance-authority clsx tailwind-merge
npm install lucide-vue-next
```

### 3. Configuração do Banco

```bash
# .env
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=meu_projeto
DB_USERNAME=root
DB_PASSWORD=

# Rodar migrations
php artisan migrate
```

---

## Estrutura de Diretórios

```
meu-projeto/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginController.php
│   │   │   │   └── RegisterController.php
│   │   │   ├── UserController.php
│   │   │   └── DashboardController.php
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── SetLocale.php
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   │   └── LoginRequest.php
│   │   │   └── User/
│   │   │       ├── StoreUserRequest.php
│   │   │       └── UpdateUserRequest.php
│   │   └── Resources/
│   │       └── UserResource.php
│   │
│   ├── Models/
│   │   ├── User.php
│   │   └── Role.php
│   │
│   ├── Services/
│   │   ├── UserService.php
│   │   └── AuthService.php
│   │
│   ├── Enums/
│   │   └── UserStatus.php
│   │
│   └── Exceptions/
│       └── Handler.php
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── RoleSeeder.php
│   │   └── UserSeeder.php
│   └── factories/
│
├── resources/
│   ├── js/
│   │   ├── app.ts                    # Entry point
│   │   ├── Pages/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.vue
│   │   │   │   └── Register.vue
│   │   │   ├── Dashboard.vue
│   │   │   └── Users/
│   │   │       ├── Index.vue
│   │   │       ├── Create.vue
│   │   │       └── Edit.vue
│   │   ├── Components/
│   │   │   ├── ui/                   # shadcn-vue
│   │   │   ├── LanguageSwitcher.vue
│   │   │   └── DataTable.vue
│   │   ├── Layouts/
│   │   │   ├── AuthenticatedLayout.vue
│   │   │   └── GuestLayout.vue
│   │   ├── Composables/
│   │   │   ├── usePermissions.ts
│   │   │   └── useToast.ts
│   │   └── types/
│   │       └── index.d.ts
│   │
│   ├── css/
│   │   └── app.css
│   │
│   └── views/
│       └── app.blade.php
│
├── routes/
│   ├── web.php
│   ├── api.php
│   └── auth.php
│
├── lang/                             # Internacionalização
│   ├── pt-BR/
│   │   ├── auth.php
│   │   ├── pagination.php
│   │   ├── passwords.php
│   │   └── validation.php
│   ├── en/
│   │   └── ...
│   └── es/
│       └── ...
│
├── config/
│   ├── app.php
│   ├── database.php
│   ├── sanctum.php
│   └── permission.php
│
├── docker/
│   ├── nginx/
│   │   └── default.conf
│   ├── php/
│   │   └── Dockerfile
│   └── docker-compose.yml
│
├── .env.example
├── composer.json
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── phpstan.neon
```

---

## Configurações Essenciais

### composer.json

```json
{
    "name": "empresa/meu-projeto",
    "type": "project",
    "require": {
        "php": "^8.3",
        "laravel/framework": "^11.0",
        "laravel/sanctum": "^4.0",
        "laravel/tinker": "^2.9",
        "inertiajs/inertia-laravel": "^1.0",
        "spatie/laravel-permission": "^6.0",
        "aws/aws-sdk-php": "^3.300"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.13",
        "laravel/sail": "^1.26",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^8.0",
        "phpunit/phpunit": "^11.0",
        "phpstan/phpstan": "^1.10",
        "larastan/larastan": "^2.9"
    }
}
```

### package.json

```json
{
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vue-tsc && vite build",
        "lint": "eslint . --ext .vue,.js,.ts",
        "type-check": "vue-tsc --noEmit"
    },
    "dependencies": {
        "@inertiajs/vue3": "^1.0",
        "@vueuse/core": "^10.9",
        "vue": "^3.4",
        "axios": "^1.7",
        "radix-vue": "^1.8",
        "class-variance-authority": "^0.7",
        "clsx": "^2.1",
        "tailwind-merge": "^2.3",
        "lucide-vue-next": "^0.378"
    },
    "devDependencies": {
        "@vitejs/plugin-vue": "^5.0",
        "typescript": "^5.4",
        "vue-tsc": "^2.0",
        "vite": "^5.2",
        "tailwindcss": "^3.4",
        "postcss": "^8.4",
        "autoprefixer": "^10.4",
        "@types/node": "^20.0"
    }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.ts'],
            refresh: true,
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
});
```

### tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "strict": true,
        "jsx": "preserve",
        "importHelpers": true,
        "experimentalDecorators": true,
        "skipLibCheck": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "sourceMap": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["resources/js/*"]
        },
        "types": ["vite/client"]
    },
    "include": ["resources/js/**/*.ts", "resources/js/**/*.vue"],
    "exclude": ["node_modules"]
}
```

---

## Código Base

### app.blade.php

```html
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'Laravel') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.ts'])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
```

### resources/js/app.ts

```typescript
import './bootstrap';
import '../css/app.css';

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob('./Pages/**/*.vue')
        ),
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .mount(el);
    },
    progress: {
        color: '#4B5563',
    },
});
```

### HandleInertiaRequests.php

```php
<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'permissions' => $request->user()->getAllPermissions()->pluck('name'),
                    'roles' => $request->user()->getRoleNames(),
                ] : null,
            ],
            'locale' => app()->getLocale(),
            'translations' => $this->getTranslations(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    private function getTranslations(): array
    {
        $locale = app()->getLocale();
        $path = lang_path("{$locale}.json");

        if (file_exists($path)) {
            return json_decode(file_get_contents($path), true);
        }

        return [];
    }
}
```

### UserController.php

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(): Response
    {
        $users = User::with('roles')
            ->latest()
            ->paginate(10);

        return Inertia::render('Users/Index', [
            'users' => UserResource::collection($users),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/Create', [
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->create($request->validated());

        return redirect()
            ->route('users.index')
            ->with('success', __('users.created'));
    }

    public function show(User $user): Response
    {
        return Inertia::render('Users/Show', [
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Users/Edit', [
            'user' => new UserResource($user->load('roles')),
            'roles' => Role::all(['id', 'name']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->update($user, $request->validated());

        return redirect()
            ->route('users.index')
            ->with('success', __('users.updated'));
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->userService->delete($user);

        return redirect()
            ->route('users.index')
            ->with('success', __('users.deleted'));
    }
}
```

### UserService.php

```php
<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function create(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        return $user;
    }

    public function update(User $user, array $data): User
    {
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }

        return $user;
    }

    public function delete(User $user): bool
    {
        return $user->delete();
    }
}
```

### StoreUserRequest.php

```php
<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

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
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['exists:roles,name'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => __('validation.required', ['attribute' => __('users.name')]),
            'email.required' => __('validation.required', ['attribute' => __('users.email')]),
            'email.unique' => __('validation.unique', ['attribute' => __('users.email')]),
        ];
    }
}
```

### UserResource.php

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'roles' => $this->whenLoaded('roles', fn () =>
                $this->roles->pluck('name')
            ),
            'permissions' => $this->whenLoaded('permissions', fn () =>
                $this->getAllPermissions()->pluck('name')
            ),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
```

---

## Internacionalização

### lang/pt-BR.json

```json
{
    "Welcome": "Bem-vindo",
    "Login": "Entrar",
    "Logout": "Sair",
    "Register": "Cadastrar",
    "Email": "E-mail",
    "Password": "Senha",
    "Remember me": "Lembrar de mim",
    "Forgot your password?": "Esqueceu sua senha?",
    "Dashboard": "Painel",
    "Users": "Usuários",
    "New User": "Novo Usuário",
    "Edit User": "Editar Usuário",
    "Name": "Nome",
    "Role": "Perfil",
    "Actions": "Ações",
    "Save": "Salvar",
    "Cancel": "Cancelar",
    "Delete": "Excluir",
    "Edit": "Editar",
    "Search": "Buscar",
    "Confirm": "Confirmar",
    "Are you sure?": "Tem certeza?",
    "This action cannot be undone.": "Esta ação não pode ser desfeita."
}
```

### lang/en.json

```json
{
    "Welcome": "Welcome",
    "Login": "Login",
    "Logout": "Logout",
    "Register": "Register",
    "Email": "Email",
    "Password": "Password",
    "Remember me": "Remember me",
    "Forgot your password?": "Forgot your password?",
    "Dashboard": "Dashboard",
    "Users": "Users",
    "New User": "New User",
    "Edit User": "Edit User",
    "Name": "Name",
    "Role": "Role",
    "Actions": "Actions",
    "Save": "Save",
    "Cancel": "Cancel",
    "Delete": "Delete",
    "Edit": "Edit",
    "Search": "Search",
    "Confirm": "Confirm",
    "Are you sure?": "Are you sure?",
    "This action cannot be undone.": "This action cannot be undone."
}
```

### SetLocale Middleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $locale = $request->session()->get('locale')
            ?? $request->cookie('locale')
            ?? $request->getPreferredLanguage(['pt-BR', 'en', 'es'])
            ?? config('app.locale');

        App::setLocale($locale);

        return $next($request);
    }
}
```

---

## Vue Components

### Pages/Users/Index.vue

```vue
<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Button } from '@/Components/ui/button';
import DataTable from '@/Components/DataTable.vue';
import { usePage } from '@inertiajs/vue3';

interface User {
    id: number;
    name: string;
    email: string;
    roles: string[];
    created_at: string;
}

interface Props {
    users: {
        data: User[];
        meta: {
            current_page: number;
            last_page: number;
            total: number;
        };
    };
}

defineProps<Props>();

const { props } = usePage();

const deleteUser = (id: number) => {
    if (confirm(props.translations['Are you sure?'])) {
        router.delete(route('users.destroy', id));
    }
};
</script>

<template>
    <Head :title="$page.props.translations['Users']" />

    <AuthenticatedLayout>
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="text-xl font-semibold">
                    {{ $page.props.translations['Users'] }}
                </h2>
                <Link :href="route('users.create')">
                    <Button>
                        {{ $page.props.translations['New User'] }}
                    </Button>
                </Link>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <DataTable
                    :data="users.data"
                    :columns="[
                        { key: 'name', label: $page.props.translations['Name'] },
                        { key: 'email', label: $page.props.translations['Email'] },
                        { key: 'roles', label: $page.props.translations['Role'] },
                        { key: 'actions', label: $page.props.translations['Actions'] },
                    ]"
                >
                    <template #roles="{ item }">
                        <span
                            v-for="role in item.roles"
                            :key="role"
                            class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                            {{ role }}
                        </span>
                    </template>

                    <template #actions="{ item }">
                        <div class="flex gap-2">
                            <Link :href="route('users.edit', item.id)">
                                <Button variant="outline" size="sm">
                                    {{ $page.props.translations['Edit'] }}
                                </Button>
                            </Link>
                            <Button
                                variant="destructive"
                                size="sm"
                                @click="deleteUser(item.id)"
                            >
                                {{ $page.props.translations['Delete'] }}
                            </Button>
                        </div>
                    </template>
                </DataTable>
            </div>
        </div>
    </AuthenticatedLayout>
</template>
```

### Components/LanguageSwitcher.vue

```vue
<script setup lang="ts">
import { router, usePage } from '@inertiajs/vue3';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';

const languages = [
    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
];

const { props } = usePage();

const changeLocale = (locale: string) => {
    router.post(route('locale.change'), { locale }, {
        preserveState: true,
        preserveScroll: true,
    });
};
</script>

<template>
    <Select :model-value="props.locale" @update:model-value="changeLocale">
        <SelectTrigger class="w-[140px]">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem
                v-for="lang in languages"
                :key="lang.code"
                :value="lang.code"
            >
                {{ lang.flag }} {{ lang.label }}
            </SelectItem>
        </SelectContent>
    </Select>
</template>
```

---

## Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ===========================================
  # APP (PHP-FPM)
  # ===========================================
  app:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    container_name: ${APP_NAME:-laravel}_app
    restart: unless-stopped
    working_dir: /var/www
    volumes:
      - .:/var/www
      - ./docker/php/local.ini:/usr/local/etc/php/conf.d/local.ini
    networks:
      - app_network
    depends_on:
      - mariadb
      - redis

  # ===========================================
  # NGINX
  # ===========================================
  nginx:
    image: nginx:alpine
    container_name: ${APP_NAME:-laravel}_nginx
    restart: unless-stopped
    ports:
      - "${APP_PORT:-80}:80"
    volumes:
      - .:/var/www
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    networks:
      - app_network
    depends_on:
      - app

  # ===========================================
  # DATABASE (MariaDB)
  # ===========================================
  mariadb:
    image: mariadb:10.11
    container_name: ${APP_NAME:-laravel}_mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${DB_DATABASE:-laravel}
      MYSQL_USER: ${DB_USERNAME:-laravel}
      MYSQL_PASSWORD: ${DB_PASSWORD:-secret}
    ports:
      - "${DB_PORT:-3306}:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    networks:
      - app_network

  # ===========================================
  # REDIS
  # ===========================================
  redis:
    image: redis:7-alpine
    container_name: ${APP_NAME:-laravel}_redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    networks:
      - app_network

  # ===========================================
  # QUEUE WORKER
  # ===========================================
  queue:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    container_name: ${APP_NAME:-laravel}_queue
    restart: unless-stopped
    working_dir: /var/www
    command: php artisan queue:work --sleep=3 --tries=3
    volumes:
      - .:/var/www
    networks:
      - app_network
    depends_on:
      - app
      - redis

volumes:
  mariadb_data:
  redis_data:

networks:
  app_network:
    driver: bridge
```

### docker/php/Dockerfile

```dockerfile
FROM php:8.3-fpm

# Arguments
ARG user=laravel
ARG uid=1000

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user

# Set working directory
WORKDIR /var/www

USER $user
```

### docker/nginx/default.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## .env.example

```env
APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

# Locale
APP_LOCALE=pt-BR
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=pt_BR

# Database
DB_CONNECTION=mariadb
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=secret

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Cache & Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Mail (Amazon SES)
MAIL_MAILER=ses
MAIL_FROM_ADDRESS="noreply@seudominio.com"
MAIL_FROM_NAME="${APP_NAME}"

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1

# Vite
VITE_APP_NAME="${APP_NAME}"
```

---

## Comandos Úteis

```bash
# Desenvolvimento
composer install
npm install
npm run dev
php artisan serve

# Docker
docker-compose up -d
docker-compose exec app php artisan migrate --seed

# Produção
composer install --optimize-autoloader --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Testes
php artisan test
php artisan test --coverage

# Qualidade de código
./vendor/bin/pint              # Code style
./vendor/bin/phpstan analyse   # Static analysis

# Criar recursos
php artisan make:model Product -mfsc   # Model + Migration + Factory + Seeder + Controller
php artisan make:request StoreProductRequest
php artisan make:resource ProductResource
```

---

## Checklist de Novo Projeto

- [ ] Criar projeto Laravel
- [ ] Instalar Inertia.js + Vue
- [ ] Configurar TailwindCSS
- [ ] Instalar shadcn-vue
- [ ] Configurar TypeScript
- [ ] Instalar Sanctum (autenticação)
- [ ] Instalar Spatie Permission (RBAC)
- [ ] Configurar i18n (pt-BR, en)
- [ ] Configurar MariaDB
- [ ] Configurar Redis
- [ ] Configurar Amazon SES
- [ ] Criar docker-compose.yml
- [ ] Rodar migrations e seeders
- [ ] Configurar PHPStan
- [ ] Configurar Laravel Pint
- [ ] Testar ambiente local

---

## Links de Referência

- [Laravel Docs](https://laravel.com/docs/11.x)
- [Inertia.js](https://inertiajs.com/)
- [Vue 3](https://vuejs.org/)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)
- [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum)

---

**Criado em**: Fevereiro 2026
**Versão**: 1.0.0
