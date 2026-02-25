# C4 Model - Diagrama de Contexto

## Nível 1: Contexto do Sistema

O diagrama de contexto mostra o sistema em seu mais alto nível de abstração,
apresentando como ele se relaciona com usuários e sistemas externos.

### Diagrama

```mermaid
C4Context
    title Diagrama de Contexto do Sistema

    Person(user, "Usuário", "Usuário final da aplicação")
    Person(admin, "Administrador", "Administrador do sistema")

    System(system, "Sistema Web", "Aplicação web completa com frontend e backend")

    System_Ext(email, "Serviço de Email", "SendGrid, AWS SES, etc.")
    System_Ext(storage, "Storage", "AWS S3, Azure Blob, etc.")
    System_Ext(payment, "Gateway de Pagamento", "Stripe, PagSeguro, etc.")
    System_Ext(analytics, "Analytics", "Google Analytics, Mixpanel, etc.")

    Rel(user, system, "Acessa via browser", "HTTPS")
    Rel(admin, system, "Administra", "HTTPS")

    Rel(system, email, "Envia emails", "API/SMTP")
    Rel(system, storage, "Armazena arquivos", "API")
    Rel(system, payment, "Processa pagamentos", "API")
    Rel(system, analytics, "Envia eventos", "API")
```

### Descrição dos Elementos

| Elemento | Tipo | Descrição |
|----------|------|-----------|
| Usuário | Pessoa | Usuário final que acessa a aplicação web |
| Administrador | Pessoa | Responsável por gerenciar o sistema |
| Sistema Web | Sistema | A aplicação sendo desenvolvida |
| Serviço de Email | Sistema Externo | Envio de emails transacionais |
| Storage | Sistema Externo | Armazenamento de arquivos (imagens, docs) |
| Gateway de Pagamento | Sistema Externo | Processamento de transações financeiras |
| Analytics | Sistema Externo | Coleta de métricas e eventos |

### Fluxos Principais

1. **Usuário → Sistema**: Acesso web via HTTPS
2. **Sistema → Email**: Notificações, confirmações, recuperação de senha
3. **Sistema → Storage**: Upload/download de arquivos
4. **Sistema → Payment**: Cobrança de assinaturas/produtos
5. **Sistema → Analytics**: Eventos de uso para análise

---

## Versão ASCII (alternativa)

```
┌─────────────────────────────────────────────────────────────────┐
│                        AMBIENTE EXTERNO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────┐                              ┌─────────────┐    │
│    │ Usuário │                              │   Admin     │    │
│    └────┬────┘                              └──────┬──────┘    │
│         │                                          │           │
│         │ HTTPS                             HTTPS  │           │
│         │                                          │           │
│         ▼                                          ▼           │
│    ┌─────────────────────────────────────────────────────┐    │
│    │                                                     │    │
│    │                   SISTEMA WEB                       │    │
│    │                                                     │    │
│    │              (Next.js + NestJS)                     │    │
│    │                                                     │    │
│    └──────┬──────────────┬──────────────┬───────────────┘    │
│           │              │              │                     │
│           ▼              ▼              ▼                     │
│    ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│    │  Email   │   │ Storage  │   │ Payment  │                │
│    │ Service  │   │  (S3)    │   │ Gateway  │                │
│    └──────────┘   └──────────┘   └──────────┘                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Próximo Nível

→ [C4 Container](./c4-container.md) - Detalhamento dos containers do sistema
