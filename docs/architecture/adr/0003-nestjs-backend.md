# ADR-0003: NestJS + Fastify como Framework Backend

## Status

**Aceito** (Atualizado)

## Contexto

O backend precisa de:

1. Framework TypeScript-first com tipagem forte
2. Arquitetura modular e escalável
3. Injeção de dependências nativa
4. Suporte a padrões enterprise (DDD, CQRS, etc.)
5. Ecossistema maduro com integrações prontas
6. **Alta performance** para suportar muitas requisições simultâneas

A aplicação terá:
- API RESTful
- Autenticação JWT
- Integração com banco de dados relacional
- Validação de dados
- Documentação OpenAPI

## Decisão

Utilizaremos **NestJS 10.x** com **Fastify** como adaptador HTTP (ao invés do Express padrão).

### Por que Fastify?

| Benchmark           | Express        | Fastify         |
|---------------------|----------------|-----------------|
| Requests/segundo    | ~15.000        | ~30.000+        |
| Latência média      | ~3.5ms         | ~1.5ms          |
| Memory footprint    | Maior          | Menor           |

### Bootstrap com Fastify

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  // Plugins Fastify
  await app.register(require('@fastify/helmet'));
  await app.register(require('@fastify/compress'));
  await app.register(require('@fastify/cors'));

  await app.listen(3001, '0.0.0.0');
}
```

### Arquitetura de Módulos

```typescript
// Módulo de domínio
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

### Padrões Adotados

1. **Modules**: Organização por domínio de negócio
2. **Controllers**: Apenas roteamento e validação
3. **Services**: Lógica de negócio
4. **Repositories**: Acesso a dados (opcional, pode usar diretamente TypeORM)
5. **DTOs**: Validação de entrada/saída
6. **Guards**: Autenticação e autorização
7. **Interceptors**: Cross-cutting concerns

## Consequências

### Positivas

- **TypeScript nativo**: Tipagem forte em toda a aplicação
- **Injeção de dependências**: Testabilidade e desacoplamento
- **Decorators**: Código declarativo e limpo
- **Ecossistema**: Integração pronta com TypeORM, Passport, Swagger
- **Arquitetura opinativa**: Estrutura consistente
- **Documentação**: Swagger/OpenAPI automático
- **Testabilidade**: Jest integrado, fácil mockar

### Negativas

- **Overhead**: Mais abstração que Express puro
- **Curva de aprendizado**: Conceitos de IoC, decorators
- **Bundle size**: Aplicação maior que frameworks minimalistas
- **Verbose**: Mais código para features simples

### Neutras

- Inspirado em Angular (familiaridade para devs Angular)
- Requer entendimento de padrões enterprise

## Alternativas Consideradas

### Alternativa 1: Express.js Puro

- **Prós**: Simples, flexível, leve
- **Contras**: Sem estrutura, sem DI nativo, sem TypeScript nativo
- **Por que não foi escolhida**: Falta de estrutura para projetos maiores

### Alternativa 2: Fastify Standalone

- **Prós**: Mais performático, schema validation
- **Contras**: Ecossistema menor, menos features prontas
- **Por que não foi escolhida**: Usamos Fastify COMO adapter do NestJS, obtendo o melhor dos dois mundos (performance do Fastify + estrutura do NestJS)

### Alternativa 3: Adonis.js

- **Prós**: Full-stack, ORM integrado
- **Contras**: Menos adoção, ecossistema menor
- **Por que não foi escolhida**: NestJS tem maior comunidade e adoção

### Alternativa 4: Hono/Elysia (Bun)

- **Prós**: Extremamente performático, moderno
- **Contras**: Ecossistema imaturo, Bun ainda em evolução
- **Por que não foi escolhida**: Precisa de estabilidade para produção

## Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Enterprise Architecture](https://docs.nestjs.com/recipes/cqrs)
- [TypeORM with NestJS](https://docs.nestjs.com/recipes/sql-typeorm)

---

**Data**: 2026-02-11
**Autor**: Arquiteto de Software
**Revisores**: Tech Lead, Backend Lead
