# Mensageria e E-mail - Amazon SES

## 1. Visão Geral

O sistema utiliza **Amazon Simple Email Service (SES)** para envio de e-mails
transacionais e notificações, oferecendo alta entregabilidade, escalabilidade
e custo-benefício.

### 1.1 Arquitetura de Mensageria

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA DE E-MAIL                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐       │
│   │   Backend    │────▶│  Mail Queue  │────▶│   Mail Worker    │       │
│   │   (NestJS)   │     │   (Redis)    │     │   (Bull Queue)   │       │
│   └──────────────┘     └──────────────┘     └────────┬─────────┘       │
│                                                       │                 │
│                                                       ▼                 │
│                                              ┌──────────────────┐       │
│                                              │   Amazon SES     │       │
│                                              │                  │       │
│                                              │  • SMTP / API    │       │
│                                              │  • Templates     │       │
│                                              │  • Tracking      │       │
│                                              └────────┬─────────┘       │
│                                                       │                 │
│                                                       ▼                 │
│                                              ┌──────────────────┐       │
│                                              │   Destinatário   │       │
│                                              │   (Usuário)      │       │
│                                              └──────────────────┘       │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                     WEBHOOKS (SNS)                           │      │
│   │   • Bounce  • Complaint  • Delivery  • Open  • Click        │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tipos de E-mail

| Tipo | Descrição | Exemplos |
|------|-----------|----------|
| **Transacional** | Acionado por ação do usuário | Confirmação de cadastro, reset de senha |
| **Notificação** | Alertas e avisos do sistema | Pedido aprovado, pagamento confirmado |
| **Marketing** | Campanhas e newsletters | Promoções, novidades (requer opt-in) |

---

## 2. Configuração AWS SES

### 2.1 Pré-requisitos

1. Conta AWS ativa
2. Domínio verificado no SES
3. Sair do sandbox (para produção)
4. Configurar DKIM e SPF

### 2.2 Variáveis de Ambiente

```bash
# .env

# ============================================
# AWS CREDENTIALS
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# ============================================
# AMAZON SES
# ============================================
SES_FROM_EMAIL=noreply@seudominio.com.br
SES_FROM_NAME=Nome da Aplicação
SES_REPLY_TO=suporte@seudominio.com.br

# Configuração de ambiente
SES_CONFIGURATION_SET=production-tracking

# Rate limiting (emails por segundo)
SES_RATE_LIMIT=14
```

### 2.3 Verificação de Domínio

```bash
# Via AWS CLI
aws ses verify-domain-identity --domain seudominio.com.br

# Configurar registros DNS retornados:
# - TXT record para verificação
# - CNAME records para DKIM
# - MX record (opcional, para recebimento)
```

---

## 3. Estrutura do Módulo

```
modules/mail/
├── mail.module.ts
├── mail.service.ts
├── mail.processor.ts           # Worker do Bull Queue
├── mail.controller.ts          # Webhooks SES
│
├── interfaces/
│   ├── mail-options.interface.ts
│   └── mail-template.interface.ts
│
├── templates/
│   ├── welcome.hbs
│   ├── reset-password.hbs
│   ├── order-confirmation.hbs
│   ├── invoice.hbs
│   └── layouts/
│       └── default.hbs
│
├── dto/
│   ├── send-mail.dto.ts
│   └── webhook-event.dto.ts
│
└── constants/
    └── mail-templates.constant.ts
```

---

## 4. Implementação

### 4.1 Mail Module

```typescript
// modules/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';
import { MailController } from './mail.controller';

@Module({
  imports: [
    // Fila de e-mails
    BullModule.registerQueueAsync({
      name: 'mail',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }),
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailProcessor],
  exports: [MailService],
})
export class MailModule {}
```

### 4.2 Mail Service

```typescript
// modules/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { MailOptions, MailTemplate } from './interfaces';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue('mail') private readonly mailQueue: Queue,
  ) {
    // Inicializa cliente SES
    this.sesClient = new SESClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.fromEmail = this.configService.get('SES_FROM_EMAIL');
    this.fromName = this.configService.get('SES_FROM_NAME');

    // Carrega templates
    this.loadTemplates();
  }

  // ============================================
  // CARREGAR TEMPLATES
  // ============================================
  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    // Registra layout parcial
    const layoutPath = path.join(templatesDir, 'layouts', 'default.hbs');
    if (fs.existsSync(layoutPath)) {
      const layoutSource = fs.readFileSync(layoutPath, 'utf-8');
      handlebars.registerPartial('layout', layoutSource);
    }

    // Registra helpers
    handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('pt-BR');
    });

    handlebars.registerHelper('formatCurrency', (value: number) => {
      return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    });

    // Carrega templates
    const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));

    for (const file of templateFiles) {
      const name = path.basename(file, '.hbs');
      const source = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
      this.templates.set(name, handlebars.compile(source));
      this.logger.log(`Template carregado: ${name}`);
    }
  }

  // ============================================
  // ENVIO ASSÍNCRONO (VIA FILA)
  // ============================================

  /**
   * Adiciona e-mail na fila para envio assíncrono
   */
  async queueMail(options: MailOptions): Promise<void> {
    await this.mailQueue.add('send', options, {
      priority: options.priority ?? 3,
      delay: options.delay ?? 0,
    });

    this.logger.log(`E-mail enfileirado para: ${options.to}`);
  }

  /**
   * Envia e-mail de boas-vindas
   */
  async sendWelcome(to: string, data: { name: string; activationLink: string }) {
    await this.queueMail({
      to,
      subject: 'Bem-vindo à nossa plataforma!',
      template: 'welcome',
      context: data,
      priority: 1,
    });
  }

  /**
   * Envia e-mail de recuperação de senha
   */
  async sendPasswordReset(to: string, data: { name: string; resetLink: string; expiresIn: string }) {
    await this.queueMail({
      to,
      subject: 'Recuperação de Senha',
      template: 'reset-password',
      context: data,
      priority: 1,
    });
  }

  /**
   * Envia confirmação de pedido
   */
  async sendOrderConfirmation(to: string, data: {
    customerName: string;
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    trackingUrl?: string;
  }) {
    await this.queueMail({
      to,
      subject: `Pedido #${data.orderNumber} confirmado`,
      template: 'order-confirmation',
      context: data,
      priority: 2,
    });
  }

  /**
   * Envia nota fiscal / invoice
   */
  async sendInvoice(to: string, data: {
    customerName: string;
    invoiceNumber: string;
    dueDate: Date;
    items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
    subtotal: number;
    tax: number;
    total: number;
  }, attachments?: Array<{ filename: string; content: Buffer }>) {
    await this.queueMail({
      to,
      subject: `Nota Fiscal #${data.invoiceNumber}`,
      template: 'invoice',
      context: data,
      attachments,
      priority: 2,
    });
  }

  // ============================================
  // ENVIO DIRETO (SEM FILA)
  // ============================================

  /**
   * Envia e-mail diretamente via SES (uso interno)
   */
  async sendDirect(options: MailOptions): Promise<string> {
    const { to, subject, template, context, html, text, attachments } = options;

    // Renderiza template se especificado
    let htmlContent = html;
    let textContent = text;

    if (template && this.templates.has(template)) {
      const templateFn = this.templates.get(template);
      htmlContent = templateFn(context);
    }

    // Prepara comando SES
    const command = new SendEmailCommand({
      Source: `${this.fromName} <${this.fromEmail}>`,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
        Body: {
          Html: htmlContent ? {
            Charset: 'UTF-8',
            Data: htmlContent,
          } : undefined,
          Text: textContent ? {
            Charset: 'UTF-8',
            Data: textContent,
          } : undefined,
        },
      },
      ConfigurationSetName: this.configService.get('SES_CONFIGURATION_SET'),
      ReplyToAddresses: [this.configService.get('SES_REPLY_TO', this.fromEmail)],
    });

    try {
      const response = await this.sesClient.send(command);
      this.logger.log(`E-mail enviado: ${response.MessageId} para ${to}`);
      return response.MessageId;
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail para ${to}:`, error);
      throw error;
    }
  }

  // ============================================
  // ENVIO EM MASSA
  // ============================================

  /**
   * Envia e-mail para múltiplos destinatários
   */
  async sendBulk(
    recipients: Array<{ email: string; data: Record<string, any> }>,
    template: string,
    subject: string,
  ): Promise<void> {
    for (const recipient of recipients) {
      await this.queueMail({
        to: recipient.email,
        subject,
        template,
        context: recipient.data,
        priority: 5, // Baixa prioridade para bulk
      });
    }

    this.logger.log(`${recipients.length} e-mails enfileirados para envio em massa`);
  }
}
```

### 4.3 Mail Processor (Worker)

```typescript
// modules/mail/mail.processor.ts
import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailOptions } from './interfaces';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('send')
  async handleSend(job: Job<MailOptions>) {
    this.logger.debug(`Processando e-mail job #${job.id}`);

    const { data } = job;

    try {
      const messageId = await this.mailService.sendDirect(data);
      return { success: true, messageId };
    } catch (error) {
      this.logger.error(`Falha no job #${job.id}:`, error.message);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job #${job.id} completado. MessageId: ${result.messageId}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job #${job.id} falhou após ${job.attemptsMade} tentativas:`, error.message);

    // Notifica administradores após falha final
    if (job.attemptsMade >= job.opts.attempts) {
      // TODO: Enviar notificação de falha
    }
  }
}
```

### 4.4 Mail Controller (Webhooks)

```typescript
// modules/mail/mail.controller.ts
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '@/modules/auth/decorators/public.decorator';

interface SESNotification {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
}

interface SESBounce {
  bounceType: 'Permanent' | 'Transient' | 'Undetermined';
  bounceSubType: string;
  bouncedRecipients: Array<{
    emailAddress: string;
    action: string;
    status: string;
    diagnosticCode: string;
  }>;
  timestamp: string;
  feedbackId: string;
}

interface SESComplaint {
  complainedRecipients: Array<{ emailAddress: string }>;
  complaintFeedbackType: string;
  timestamp: string;
  feedbackId: string;
}

@ApiTags('mail-webhooks')
@Controller('webhooks/ses')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  /**
   * Webhook para receber notificações do SES via SNS
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleSESWebhook(
    @Body() notification: SESNotification,
    @Headers('x-amz-sns-message-type') messageType: string,
  ) {
    // Confirmação de assinatura SNS
    if (messageType === 'SubscriptionConfirmation') {
      this.logger.log('SNS Subscription confirmation received');
      // TODO: Confirmar assinatura automaticamente
      return { received: true };
    }

    // Processa notificação
    if (messageType === 'Notification') {
      const message = JSON.parse(notification.Message);
      const eventType = message.eventType || message.notificationType;

      switch (eventType) {
        case 'Bounce':
          await this.handleBounce(message.bounce);
          break;

        case 'Complaint':
          await this.handleComplaint(message.complaint);
          break;

        case 'Delivery':
          this.logger.log(`E-mail entregue: ${message.mail?.messageId}`);
          break;

        case 'Open':
          this.logger.log(`E-mail aberto: ${message.mail?.messageId}`);
          await this.trackOpen(message);
          break;

        case 'Click':
          this.logger.log(`Link clicado: ${message.click?.link}`);
          await this.trackClick(message);
          break;

        default:
          this.logger.warn(`Tipo de evento desconhecido: ${eventType}`);
      }
    }

    return { received: true };
  }

  /**
   * Processa bounces (e-mails que não foram entregues)
   */
  private async handleBounce(bounce: SESBounce) {
    this.logger.warn(`Bounce recebido: ${bounce.bounceType}`);

    for (const recipient of bounce.bouncedRecipients) {
      this.logger.warn(`E-mail com bounce: ${recipient.emailAddress}`);

      // Hard bounce - marca e-mail como inválido
      if (bounce.bounceType === 'Permanent') {
        // TODO: Marcar e-mail como inválido no banco de dados
        // await this.usersService.markEmailInvalid(recipient.emailAddress);
      }
    }
  }

  /**
   * Processa complaints (marcado como spam)
   */
  private async handleComplaint(complaint: SESComplaint) {
    this.logger.warn(`Complaint recebido: ${complaint.complaintFeedbackType}`);

    for (const recipient of complaint.complainedRecipients) {
      this.logger.warn(`E-mail com complaint: ${recipient.emailAddress}`);

      // TODO: Descadastrar usuário de e-mails marketing
      // await this.usersService.unsubscribe(recipient.emailAddress);
    }
  }

  /**
   * Rastreia abertura de e-mail
   */
  private async trackOpen(message: any) {
    // TODO: Salvar evento de abertura para analytics
    // await this.analyticsService.trackEmailOpen(message);
  }

  /**
   * Rastreia clique em link
   */
  private async trackClick(message: any) {
    // TODO: Salvar evento de clique para analytics
    // await this.analyticsService.trackEmailClick(message);
  }
}
```

### 4.5 Interfaces

```typescript
// modules/mail/interfaces/mail-options.interface.ts
export interface MailOptions {
  /** Destinatário(s) */
  to: string | string[];

  /** Assunto do e-mail */
  subject: string;

  /** Nome do template a ser usado */
  template?: string;

  /** Dados para o template */
  context?: Record<string, any>;

  /** HTML customizado (alternativa ao template) */
  html?: string;

  /** Texto puro (fallback) */
  text?: string;

  /** Anexos */
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;

  /** Prioridade (1 = alta, 5 = baixa) */
  priority?: number;

  /** Delay em ms antes de enviar */
  delay?: number;

  /** CC */
  cc?: string | string[];

  /** BCC */
  bcc?: string | string[];
}
```

---

## 5. Templates de E-mail

### 5.1 Layout Base

```handlebars
{{!-- templates/layouts/default.hbs --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #2563eb;
      padding: 20px;
      text-align: center;
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    h1 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
    h2 { color: #374151; font-size: 20px; margin-bottom: 15px; }
    p { margin-bottom: 15px; }
    .text-muted { color: #6b7280; }
    .text-center { text-align: center; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding: 20px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Header -->
          <tr>
            <td class="header">
              <img src="{{logoUrl}}" alt="Logo" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              {{{body}}}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p>© {{year}} {{companyName}}. Todos os direitos reservados.</p>
              <p>
                <a href="{{unsubscribeUrl}}">Descadastrar</a> |
                <a href="{{preferencesUrl}}">Preferências</a>
              </p>
              <p class="text-muted">
                Este e-mail foi enviado para {{recipientEmail}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### 5.2 Template: Boas-vindas

```handlebars
{{!-- templates/welcome.hbs --}}
{{#> layout}}
  {{#*inline "body"}}
    <h1>Bem-vindo, {{name}}! 🎉</h1>

    <p>
      Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso
      e você já pode começar a explorar nossa plataforma.
    </p>

    <p>
      Para ativar sua conta e garantir a segurança dos seus dados, clique no
      botão abaixo:
    </p>

    <p class="text-center">
      <a href="{{activationLink}}" class="button">Ativar Minha Conta</a>
    </p>

    <p class="text-muted">
      Se você não criou esta conta, pode ignorar este e-mail com segurança.
    </p>

    <p class="text-muted">
      Este link expira em 24 horas.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

    <h2>Próximos passos:</h2>
    <ul>
      <li>Complete seu perfil</li>
      <li>Explore as funcionalidades</li>
      <li>Configure suas preferências</li>
    </ul>

    <p>
      Se precisar de ajuda, nossa equipe está à disposição em
      <a href="mailto:suporte@seudominio.com.br">suporte@seudominio.com.br</a>
    </p>

    <p>Atenciosamente,<br/>Equipe {{companyName}}</p>
  {{/inline}}
{{/layout}}
```

### 5.3 Template: Recuperação de Senha

```handlebars
{{!-- templates/reset-password.hbs --}}
{{#> layout}}
  {{#*inline "body"}}
    <h1>Recuperação de Senha</h1>

    <p>Olá, {{name}}!</p>

    <p>
      Recebemos uma solicitação para redefinir a senha da sua conta.
      Se você fez esta solicitação, clique no botão abaixo:
    </p>

    <p class="text-center">
      <a href="{{resetLink}}" class="button">Redefinir Senha</a>
    </p>

    <p class="text-muted">
      <strong>Este link expira em {{expiresIn}}.</strong>
    </p>

    <p>
      Se você não solicitou a redefinição de senha, ignore este e-mail.
      Sua senha permanecerá a mesma.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

    <p class="text-muted" style="font-size: 14px;">
      <strong>Dicas de segurança:</strong><br/>
      • Nunca compartilhe sua senha<br/>
      • Use senhas únicas para cada serviço<br/>
      • Ative a autenticação em dois fatores
    </p>
  {{/inline}}
{{/layout}}
```

### 5.4 Template: Confirmação de Pedido

```handlebars
{{!-- templates/order-confirmation.hbs --}}
{{#> layout}}
  {{#*inline "body"}}
    <h1>Pedido Confirmado! ✅</h1>

    <p>Olá, {{customerName}}!</p>

    <p>
      Seu pedido <strong>#{{orderNumber}}</strong> foi confirmado e está
      sendo processado.
    </p>

    <h2>Itens do Pedido</h2>

    <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th align="left">Produto</th>
          <th align="center">Qtd</th>
          <th align="right">Preço</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td>{{this.name}}</td>
          <td align="center">{{this.quantity}}</td>
          <td align="right">{{formatCurrency this.price}}</td>
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold; background-color: #f9fafb;">
          <td colspan="2" align="right">Total:</td>
          <td align="right">{{formatCurrency total}}</td>
        </tr>
      </tfoot>
    </table>

    {{#if trackingUrl}}
    <p class="text-center" style="margin-top: 30px;">
      <a href="{{trackingUrl}}" class="button">Rastrear Pedido</a>
    </p>
    {{/if}}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

    <p class="text-muted">
      Dúvidas? Entre em contato conosco pelo e-mail
      <a href="mailto:suporte@seudominio.com.br">suporte@seudominio.com.br</a>
    </p>
  {{/inline}}
{{/layout}}
```

---

## 6. Uso no Código

### 6.1 Injetando o Serviço

```typescript
// modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { MailService } from '@/modules/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    // ... outros serviços
  ) {}

  async register(dto: RegisterDto) {
    // Cria usuário
    const user = await this.usersService.create(dto);

    // Gera token de ativação
    const activationToken = await this.generateActivationToken(user.id);
    const activationLink = `${this.appUrl}/activate?token=${activationToken}`;

    // Envia e-mail de boas-vindas
    await this.mailService.sendWelcome(user.email, {
      name: user.name,
      activationLink,
    });

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Não revela se e-mail existe

    const resetToken = await this.generateResetToken(user.id);
    const resetLink = `${this.appUrl}/reset-password?token=${resetToken}`;

    await this.mailService.sendPasswordReset(user.email, {
      name: user.name,
      resetLink,
      expiresIn: '1 hora',
    });
  }
}
```

### 6.2 Enviando Confirmação de Pedido

```typescript
// modules/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { MailService } from '@/modules/mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(private readonly mailService: MailService) {}

  async createOrder(dto: CreateOrderDto, userId: string) {
    // Cria pedido
    const order = await this.orderRepository.save({
      ...dto,
      userId,
      status: 'confirmed',
    });

    // Busca dados para e-mail
    const user = await this.usersService.findOne(userId);
    const items = await this.getOrderItems(order.id);

    // Envia confirmação
    await this.mailService.sendOrderConfirmation(user.email, {
      customerName: user.name,
      orderNumber: order.orderNumber,
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      trackingUrl: `${this.appUrl}/orders/${order.id}`,
    });

    return order;
  }
}
```

---

## 7. Monitoramento e Métricas

### 7.1 Dashboard SES

Acesse o console AWS SES para monitorar:

- **Sending Statistics**: Taxa de envio, bounces, complaints
- **Reputation Dashboard**: Saúde do domínio
- **Suppression List**: E-mails bloqueados

### 7.2 Métricas Recomendadas

| Métrica | Limite Recomendado | Ação |
|---------|-------------------|------|
| Bounce Rate | < 5% | Limpar lista de e-mails |
| Complaint Rate | < 0.1% | Revisar conteúdo/frequência |
| Delivery Rate | > 95% | Verificar configurações DNS |

### 7.3 Alertas CloudWatch

```yaml
# cloudwatch-alarms.yml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  BounceRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SES-High-Bounce-Rate
      MetricName: Bounce
      Namespace: AWS/SES
      Statistic: Average
      Period: 3600
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  ComplaintRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SES-High-Complaint-Rate
      MetricName: Complaint
      Namespace: AWS/SES
      Statistic: Average
      Period: 3600
      EvaluationPeriods: 1
      Threshold: 0.1
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
```

---

## 8. Boas Práticas

### 8.1 Checklist

- [ ] Verificar domínio e configurar DKIM/SPF
- [ ] Sair do sandbox antes de produção
- [ ] Implementar double opt-in para marketing
- [ ] Processar bounces e complaints
- [ ] Manter lista de supressão atualizada
- [ ] Usar filas para envio assíncrono
- [ ] Implementar retry com backoff exponencial
- [ ] Monitorar métricas de entrega
- [ ] Usar templates responsivos
- [ ] Incluir versão texto dos e-mails

### 8.2 Rate Limiting

```typescript
// Respeitar limites do SES
const SES_LIMITS = {
  sandbox: {
    perSecond: 1,
    perDay: 200,
  },
  production: {
    perSecond: 14, // Pode ser aumentado via ticket
    perDay: 50000,
  },
};
```

---

## Histórico de Revisões

| Data       | Versão | Autor        | Descrição              |
|------------|--------|--------------|------------------------|
| 2026-02-11 | 1.0.0  | Arquiteto    | Versão inicial         |
