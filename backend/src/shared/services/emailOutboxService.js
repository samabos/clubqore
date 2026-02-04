import { TemplateService } from './templateService.js';

export class EmailOutboxService {
  constructor(db, emailService) {
    this.db = db;
    this.emailService = emailService;
    this.templateService = new TemplateService(db);
  }

  /**
   * Send an email and log it to the outbox
   * @param {object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} [options.subject] - Email subject (required if not using template)
   * @param {string} [options.text] - Plain text body (required if not using template)
   * @param {string} [options.html] - HTML body (required if not using template)
   * @param {string} [options.templateKey] - Template key to use from database
   * @param {object} [options.templateData] - Data to render in the template
   */
  async sendAndLog({ to, subject, text, html, templateKey, templateData }) {
    let finalSubject = subject;
    let finalText = text;
    let finalHtml = html;

    // If using a template, render it
    if (templateKey) {
      const rendered = await this.templateService.renderEmailTemplate(templateKey, templateData || {});
      finalSubject = rendered.subject;
      finalText = rendered.text;
      finalHtml = rendered.html;
    }

    // Validate that we have the required fields
    if (!finalSubject || !finalText || !finalHtml) {
      throw new Error('Email must have subject, text, and html (either provided directly or via template)');
    }

    // Store before sending to track
    const [record] = await this.db('email_outbox')
      .insert({
        to_email: to,
        subject: finalSubject,
        body_text: finalText,
        body_html: finalHtml,
        template: templateKey || null,
        template_data: templateData ? JSON.stringify(templateData) : null,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning(['id']);

    const outboxId = record.id || record;

    try {
      const result = await this.emailService.sendEmail({
        to,
        subject: finalSubject,
        text: finalText,
        html: finalHtml
      });

      await this.db('email_outbox')
        .where({ id: outboxId })
        .update({
          status: 'sent',
          provider_message_id: result.messageId || null,
          sent_at: new Date(),
          updated_at: new Date()
        });

      return { id: outboxId, ...result };
    } catch (error) {
      await this.db('email_outbox')
        .where({ id: outboxId })
        .update({
          status: 'failed',
          error_message: error.message || 'Failed to send email',
          updated_at: new Date()
        });
      throw error;
    }
  }
}


