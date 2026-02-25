import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SettingsService } from '../settings/settings.service';

export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly settings: SettingsService) {}

  private createClient(): { ses: SESClient; fromEmail: string } | null {
    const region = this.settings.get('ses_aws_region');
    const accessKeyId = this.settings.get('ses_access_key_id');
    const secretAccessKey = this.settings.get('ses_secret_access_key');
    const fromEmail = this.settings.get('ses_from_email', 'noreply@conectenvios.com.br');

    if (!region || !accessKeyId || !secretAccessKey) {
      return null;
    }

    return {
      ses: new SESClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      }),
      fromEmail,
    };
  }

  private getAppUrl(): string {
    return this.settings.get('app_url', 'http://localhost:3000');
  }

  async send(payload: EmailPayload): Promise<void> {
    const client = this.createClient();

    if (!client) {
      this.logger.debug(`[MAIL PREVIEW] To: ${payload.to.join(', ')} | Subject: ${payload.subject}`);
      return;
    }

    try {
      await client.ses.send(
        new SendEmailCommand({
          Source: client.fromEmail,
          Destination: { ToAddresses: payload.to },
          Message: {
            Subject: { Data: payload.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: payload.html, Charset: 'UTF-8' },
            },
          },
        }),
      );
      this.logger.log(`Email sent to ${payload.to.join(', ')}: ${payload.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to.join(', ')}: ${error.message}`);
    }
  }

  private wrap(title: string, body: string): string {
    const appUrl = this.getAppUrl();
    const appName = this.settings.get('app_name', 'Conectenvios Kanban');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:bold;">Conectenvios</span>
              <span style="color:#8b8fa3;font-size:14px;margin-left:8px;">Kanban</span>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <h2 style="margin:0;color:#1a1a2e;font-size:18px;">${title}</h2>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:8px 32px 24px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este e-mail foi enviado automaticamente pelo ${appName}.
                <br>
                <a href="${appUrl}/kanban" style="color:#4f46e5;text-decoration:none;">Acessar o sistema</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  }

  // ── Notification methods ──────────────────────────────────────────

  async notifyMemberAdded(params: {
    projectTitle: string;
    addedUserName: string;
    addedByName: string;
    recipientEmails: string[];
  }): Promise<void> {
    const body = `
      <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
        <strong>${params.addedByName}</strong> adicionou <strong>${params.addedUserName}</strong>
        como membro do projeto:
      </p>
      <div style="background:#f3f4f6;border-left:4px solid #4f46e5;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
        <strong style="color:#1a1a2e;">${params.projectTitle}</strong>
      </div>
    `;

    await this.send({
      to: params.recipientEmails,
      subject: `[Kanban] ${params.addedUserName} foi adicionado ao projeto "${params.projectTitle}"`,
      html: this.wrap('Novo membro no projeto', body),
    });
  }

  async notifyProjectMoved(params: {
    projectTitle: string;
    fromStage: string;
    toStage: string;
    movedByName: string;
    recipientEmails: string[];
  }): Promise<void> {
    const body = `
      <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
        <strong>${params.movedByName}</strong> moveu o projeto para uma nova etapa:
      </p>
      <div style="background:#f3f4f6;border-left:4px solid #4f46e5;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
        <strong style="color:#1a1a2e;">${params.projectTitle}</strong>
      </div>
      <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="padding:6px 12px;background:#fee2e2;border-radius:4px;font-size:13px;color:#991b1b;">
            ${params.fromStage}
          </td>
          <td style="padding:0 12px;font-size:18px;color:#9ca3af;">&rarr;</td>
          <td style="padding:6px 12px;background:#d1fae5;border-radius:4px;font-size:13px;color:#065f46;">
            ${params.toStage}
          </td>
        </tr>
      </table>
    `;

    await this.send({
      to: params.recipientEmails,
      subject: `[Kanban] Projeto "${params.projectTitle}" movido para ${params.toStage}`,
      html: this.wrap('Projeto movido de etapa', body),
    });
  }

  async notifyCommentAdded(params: {
    projectTitle: string;
    commentAuthorName: string;
    commentContent: string;
    recipientEmails: string[];
  }): Promise<void> {
    const truncated =
      params.commentContent.length > 300
        ? params.commentContent.slice(0, 300) + '...'
        : params.commentContent;

    const body = `
      <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
        <strong>${params.commentAuthorName}</strong> comentou no projeto:
      </p>
      <div style="background:#f3f4f6;border-left:4px solid #4f46e5;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
        <strong style="color:#1a1a2e;">${params.projectTitle}</strong>
      </div>
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">${truncated}</p>
      </div>
    `;

    await this.send({
      to: params.recipientEmails,
      subject: `[Kanban] Novo comentario no projeto "${params.projectTitle}"`,
      html: this.wrap('Novo comentario', body),
    });
  }
}
