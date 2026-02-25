# ADR-0001: Uso do Turborepo como Monorepo Manager

## Status

**Aceito**

## Contexto

O projeto requer uma estrutura que permita:

1. Compartilhar código entre frontend (Next.js) e backend (NestJS)
2. Manter tipos TypeScript sincronizados entre aplicações
3. Executar builds e testes de forma eficiente
4. Escalar o projeto com múltiplos pacotes/aplicações

A equipe precisa de uma ferramenta de gerenciamento de monorepo que seja:
- Fácil de configurar e manter
- Performática para builds
- Compatível com o ecossistema Node.js/TypeScript

## Decisão

Utilizaremos **Turborepo 2.0** como ferramenta de gerenciamento do monorepo.

### Configuração Básica

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    }
  }
}
```

## Consequências

### Positivas

- **Cache inteligente**: Builds incrementais com cache local e remoto
- **Paralelização**: Execução paralela de tarefas independentes
- **Ordenação topológica**: Respeita dependências entre pacotes
- **Zero config para TS**: Funciona nativamente com TypeScript
- **Integração com pnpm**: Suporte nativo a workspaces pnpm
- **Remote caching**: Possibilidade de cache compartilhado em CI/CD

### Negativas

- **Curva de aprendizado**: Time precisa aprender nova ferramenta
- **Vendor lock-in leve**: Configurações específicas do Turborepo
- **Debug mais complexo**: Problemas de cache podem ser difíceis de diagnosticar

### Neutras

- Requer Node.js 18+
- Documentação em constante evolução

## Alternativas Consideradas

### Alternativa 1: Nx

- **Prós**: Mais features, generators, plugins
- **Contras**: Mais complexo, curva de aprendizado maior, mais opinativo
- **Por que não foi escolhida**: Overhead desnecessário para o escopo atual

### Alternativa 2: Lerna

- **Prós**: Maduro, bem documentado
- **Contras**: Performance inferior, menos features de cache
- **Por que não foi escolhida**: Turborepo oferece melhor performance

### Alternativa 3: Yarn Workspaces (sem ferramenta adicional)

- **Prós**: Simples, sem dependências extras
- **Contras**: Sem cache, sem paralelização inteligente
- **Por que não foi escolhida**: Não escala bem para projetos maiores

## Referências

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Monorepo Tools Comparison](https://monorepo.tools/)
- [Turborepo vs Nx](https://turbo.build/repo/docs/handbook/migrating-from-nx)

---

**Data**: 2026-02-11
**Autor**: Arquiteto de Software
**Revisores**: Tech Lead, Senior Developer
