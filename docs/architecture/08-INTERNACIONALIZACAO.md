# Internacionalização (i18n)

## 1. Visão Geral

A aplicação suporta múltiplos idiomas com a seguinte hierarquia:

| Prioridade | Idioma     | Código | Status     |
|------------|------------|--------|------------|
| 1º         | Português  | `pt-BR`| Principal  |
| 2º         | Inglês     | `en`   | Secundário |
| 3º         | Espanhol   | `es`   | Futuro     |

---

## 2. Stack de i18n

### Frontend (Next.js)
- **next-intl** - Biblioteca oficial recomendada para App Router
- Suporte a Server Components
- Tipagem TypeScript completa

### Backend (NestJS)
- **nestjs-i18n** - Módulo oficial para NestJS
- Tradução de mensagens de erro
- Validação multilíngue

---

## 3. Configuração Frontend

### 3.1 Instalação

```bash
cd apps/web
pnpm add next-intl
```

### 3.2 Estrutura de Arquivos

```
apps/web/
├── src/
│   ├── i18n/
│   │   ├── request.ts           # Configuração do i18n
│   │   └── routing.ts           # Configuração de rotas
│   │
│   ├── messages/                # Arquivos de tradução
│   │   ├── pt-BR.json          # Português (principal)
│   │   ├── en.json             # Inglês
│   │   └── es.json             # Espanhol (futuro)
│   │
│   └── app/
│       └── [locale]/           # Rotas com locale
│           ├── layout.tsx
│           └── page.tsx
```

### 3.3 Configuração next-intl

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pt-BR', 'en', 'es'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed', // Só mostra prefixo se não for pt-BR
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 3.4 Middleware

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(pt-BR|en|es)/:path*'],
};
```

### 3.5 Layout com Locale

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

### 3.6 Arquivos de Tradução

```json
// src/messages/pt-BR.json
{
  "common": {
    "loading": "Carregando...",
    "error": "Ocorreu um erro",
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "search": "Buscar",
    "confirm": "Confirmar",
    "back": "Voltar",
    "next": "Próximo",
    "yes": "Sim",
    "no": "Não"
  },
  "auth": {
    "login": "Entrar",
    "logout": "Sair",
    "register": "Cadastrar",
    "email": "E-mail",
    "password": "Senha",
    "forgotPassword": "Esqueceu a senha?",
    "rememberMe": "Lembrar de mim",
    "loginSuccess": "Login realizado com sucesso",
    "loginError": "E-mail ou senha inválidos",
    "sessionExpired": "Sua sessão expirou. Faça login novamente."
  },
  "validation": {
    "required": "Este campo é obrigatório",
    "invalidEmail": "E-mail inválido",
    "minLength": "Mínimo de {min} caracteres",
    "maxLength": "Máximo de {max} caracteres",
    "passwordMismatch": "As senhas não conferem"
  },
  "users": {
    "title": "Usuários",
    "newUser": "Novo Usuário",
    "editUser": "Editar Usuário",
    "name": "Nome",
    "email": "E-mail",
    "role": "Perfil",
    "status": "Status",
    "active": "Ativo",
    "inactive": "Inativo",
    "createdAt": "Criado em",
    "actions": "Ações"
  },
  "errors": {
    "notFound": "Página não encontrada",
    "unauthorized": "Acesso não autorizado",
    "forbidden": "Acesso negado",
    "serverError": "Erro interno do servidor",
    "networkError": "Erro de conexão"
  }
}
```

```json
// src/messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "yes": "Yes",
    "no": "No"
  },
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out",
    "register": "Sign Up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "rememberMe": "Remember me",
    "loginSuccess": "Successfully logged in",
    "loginError": "Invalid email or password",
    "sessionExpired": "Your session has expired. Please sign in again."
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Invalid email",
    "minLength": "Minimum {min} characters",
    "maxLength": "Maximum {max} characters",
    "passwordMismatch": "Passwords do not match"
  },
  "users": {
    "title": "Users",
    "newUser": "New User",
    "editUser": "Edit User",
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "createdAt": "Created at",
    "actions": "Actions"
  },
  "errors": {
    "notFound": "Page not found",
    "unauthorized": "Unauthorized access",
    "forbidden": "Access denied",
    "serverError": "Internal server error",
    "networkError": "Connection error"
  }
}
```

```json
// src/messages/es.json (Futuro)
{
  "common": {
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "search": "Buscar",
    "confirm": "Confirmar",
    "back": "Volver",
    "next": "Siguiente",
    "yes": "Sí",
    "no": "No"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "register": "Registrarse",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "rememberMe": "Recordarme",
    "loginSuccess": "Sesión iniciada correctamente",
    "loginError": "Correo o contraseña inválidos",
    "sessionExpired": "Tu sesión ha expirado. Inicia sesión nuevamente."
  },
  "validation": {
    "required": "Este campo es obligatorio",
    "invalidEmail": "Correo inválido",
    "minLength": "Mínimo {min} caracteres",
    "maxLength": "Máximo {max} caracteres",
    "passwordMismatch": "Las contraseñas no coinciden"
  },
  "users": {
    "title": "Usuarios",
    "newUser": "Nuevo Usuario",
    "editUser": "Editar Usuario",
    "name": "Nombre",
    "email": "Correo",
    "role": "Rol",
    "status": "Estado",
    "active": "Activo",
    "inactive": "Inactivo",
    "createdAt": "Creado el",
    "actions": "Acciones"
  },
  "errors": {
    "notFound": "Página no encontrada",
    "unauthorized": "Acceso no autorizado",
    "forbidden": "Acceso denegado",
    "serverError": "Error interno del servidor",
    "networkError": "Error de conexión"
  }
}
```

### 3.7 Uso em Componentes

```typescript
// Server Component
import { useTranslations } from 'next-intl';

export default function UsersPage() {
  const t = useTranslations('users');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('newUser')}</button>
    </div>
  );
}
```

```typescript
// Client Component
'use client';

import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');

  return (
    <form>
      <label>{t('email')}</label>
      <input type="email" />

      <label>{t('password')}</label>
      <input type="password" />

      <button type="submit">{t('login')}</button>
    </form>
  );
}
```

### 3.8 Seletor de Idioma

```typescript
// src/components/language-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const current = languages.find((l) => l.code === locale);

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          {current?.flag} {current?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 4. Configuração Backend

### 4.1 Instalação

```bash
cd apps/api
pnpm add nestjs-i18n
```

### 4.2 Estrutura de Arquivos

```
apps/api/
├── src/
│   ├── i18n/
│   │   ├── pt-BR/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── users.json
│   │   │   └── validation.json
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── users.json
│   │   │   └── validation.json
│   │   └── es/
│   │       └── ... (futuro)
```

### 4.3 Configuração do Módulo

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'pt-BR',
      fallbacks: {
        'pt-*': 'pt-BR',
        'en-*': 'en',
        'es-*': 'es',
      },
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'locale']),
        new HeaderResolver(['x-lang', 'accept-language']),
        AcceptLanguageResolver,
      ],
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

### 4.4 Arquivos de Tradução Backend

```json
// src/i18n/pt-BR/validation.json
{
  "REQUIRED": "O campo {field} é obrigatório",
  "INVALID_EMAIL": "E-mail inválido",
  "MIN_LENGTH": "O campo {field} deve ter no mínimo {min} caracteres",
  "MAX_LENGTH": "O campo {field} deve ter no máximo {max} caracteres",
  "INVALID_PASSWORD": "A senha deve conter maiúscula, minúscula e número"
}
```

```json
// src/i18n/pt-BR/auth.json
{
  "LOGIN_SUCCESS": "Login realizado com sucesso",
  "LOGIN_FAILED": "E-mail ou senha inválidos",
  "UNAUTHORIZED": "Não autorizado",
  "TOKEN_EXPIRED": "Token expirado",
  "TOKEN_INVALID": "Token inválido",
  "USER_NOT_FOUND": "Usuário não encontrado",
  "USER_INACTIVE": "Usuário inativo"
}
```

```json
// src/i18n/en/validation.json
{
  "REQUIRED": "The {field} field is required",
  "INVALID_EMAIL": "Invalid email",
  "MIN_LENGTH": "The {field} field must have at least {min} characters",
  "MAX_LENGTH": "The {field} field must have at most {max} characters",
  "INVALID_PASSWORD": "Password must contain uppercase, lowercase and number"
}
```

```json
// src/i18n/en/auth.json
{
  "LOGIN_SUCCESS": "Successfully logged in",
  "LOGIN_FAILED": "Invalid email or password",
  "UNAUTHORIZED": "Unauthorized",
  "TOKEN_EXPIRED": "Token expired",
  "TOKEN_INVALID": "Invalid token",
  "USER_NOT_FOUND": "User not found",
  "USER_INACTIVE": "User inactive"
}
```

### 4.5 Uso no Service

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(private readonly i18n: I18nService) {}

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('auth.LOGIN_FAILED'),
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        this.i18n.t('auth.USER_INACTIVE'),
      );
    }

    return this.generateTokens(user);
  }
}
```

### 4.6 Validação com i18n

```typescript
// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @IsString({ message: i18nValidationMessage('validation.REQUIRED', { field: 'name' }) })
  name: string;

  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email: string;

  @MinLength(8, { message: i18nValidationMessage('validation.MIN_LENGTH', { field: 'password', min: 8 }) })
  password: string;
}
```

### 4.7 Exception Filter com i18n

```typescript
// src/common/filters/i18n-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { FastifyReply } from 'fastify';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    let message = exceptionResponse.message;

    // Traduz se for uma chave de tradução
    if (typeof message === 'string' && message.includes('.')) {
      message = this.i18n.t(message);
    }

    response.code(status).send({
      success: false,
      error: {
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

---

## 5. Tabela de Idiomas

| Código  | Idioma     | Status       | Arquivos                     |
|---------|------------|--------------|------------------------------|
| `pt-BR` | Português  | ✅ Principal  | `messages/pt-BR.json`        |
| `en`    | English    | ✅ Secundário | `messages/en.json`           |
| `es`    | Español    | 🔜 Futuro     | `messages/es.json`           |
| `fr`    | Français   | ❌ Não planejado | -                         |
| `de`    | Deutsch    | ❌ Não planejado | -                         |

### Como adicionar novo idioma:

1. Criar arquivo `messages/{locale}.json` no frontend
2. Criar pasta `i18n/{locale}/` no backend
3. Adicionar locale em `routing.ts` e `middleware.ts`
4. Adicionar na tabela `languages` do componente `LanguageSwitcher`

---

## 6. Boas Práticas

### 6.1 Organização de Chaves

```
{namespace}.{categoria}.{chave}

Exemplos:
- auth.login
- auth.errors.invalidPassword
- users.form.name
- common.buttons.save
```

### 6.2 Interpolação

```json
{
  "welcome": "Olá, {name}!",
  "items": "Você tem {count, plural, =0 {nenhum item} =1 {1 item} other {# itens}}"
}
```

```typescript
t('welcome', { name: 'João' });
// "Olá, João!"

t('items', { count: 5 });
// "Você tem 5 itens"
```

### 6.3 Datas e Números

```typescript
import { useFormatter } from 'next-intl';

function Component() {
  const format = useFormatter();

  return (
    <>
      {/* Data */}
      <p>{format.dateTime(new Date(), { dateStyle: 'long' })}</p>
      {/* pt-BR: "11 de fevereiro de 2026" */}
      {/* en: "February 11, 2026" */}

      {/* Moeda */}
      <p>{format.number(1234.56, { style: 'currency', currency: 'BRL' })}</p>
      {/* pt-BR: "R$ 1.234,56" */}
      {/* en: "R$1,234.56" */}
    </>
  );
}
```

---

## 7. Dependências

### Frontend

```json
{
  "dependencies": {
    "next-intl": "^3.15.0"
  }
}
```

### Backend

```json
{
  "dependencies": {
    "nestjs-i18n": "^10.4.0"
  }
}
```

---

## Próximos Documentos

- [Perfis e Permissões](./09-PERFIS-PERMISSOES.md) - Sistema RBAC
- [Frontend Perfis](./10-FRONTEND-PERFIS.md) - UI de gerenciamento

---

## Histórico de Revisões

| Data       | Versão | Autor        | Descrição              |
|------------|--------|--------------|------------------------|
| 2026-02-12 | 1.0.0  | Arquiteto    | Versão inicial         |
