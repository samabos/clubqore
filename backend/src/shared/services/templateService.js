export class TemplateService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get a template by its key
   * @param {string} templateKey - The unique template key
   * @returns {Promise<object|null>} The template object or null if not found
   */
  async getTemplate(templateKey) {
    try {
      const template = await this.db('email_templates')
        .where({ template_key: templateKey, is_active: true })
        .first();

      return template;
    } catch (error) {
      console.error(`Error fetching template ${templateKey}:`, error);
      throw error;
    }
  }

  /**
   * Simple template variable replacement (supports {{variableName}})
   * @param {string} template - The template string with {{variables}}
   * @param {object} data - The data object with variable values
   * @returns {string} The rendered template
   */
  renderTemplate(template, data) {
    if (!template) return '';

    let rendered = template;

    // Replace all {{variableName}} with actual values
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = data[key] !== undefined && data[key] !== null ? data[key] : '';
      rendered = rendered.replace(regex, value);
    });

    // Handle conditional blocks: {{#variableName}}...{{/variableName}}
    // Only show the block if the variable has a truthy value
    rendered = rendered.replace(/{{#(\w+)}}([\s\S]*?){{\/\1}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });

    // Clean up any remaining unreplaced variables
    rendered = rendered.replace(/{{[\w]+}}/g, '');

    return rendered;
  }

  /**
   * Get and render a template with data
   * @param {string} templateKey - The unique template key
   * @param {object} data - The data to render in the template
   * @returns {Promise<object>} Object with subject, text, and html
   */
  async renderEmailTemplate(templateKey, data) {
    const template = await this.getTemplate(templateKey);

    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    return {
      subject: this.renderTemplate(template.subject, data),
      text: this.renderTemplate(template.body_text, data),
      html: this.renderTemplate(template.body_html, data)
    };
  }

  /**
   * Get all active templates
   * @returns {Promise<array>} Array of all active templates
   */
  async getAllTemplates() {
    try {
      const templates = await this.db('email_templates')
        .where({ is_active: true })
        .select('*')
        .orderBy('template_key', 'asc');

      return templates;
    } catch (error) {
      console.error('Error fetching all templates:', error);
      throw error;
    }
  }

  /**
   * Create or update a template
   * @param {string} templateKey - The unique template key
   * @param {object} templateData - The template data
   * @returns {Promise<object>} The created/updated template
   */
  async upsertTemplate(templateKey, templateData) {
    try {
      const existing = await this.db('email_templates')
        .where({ template_key: templateKey })
        .first();

      if (existing) {
        // Update existing template
        await this.db('email_templates')
          .where({ template_key: templateKey })
          .update({
            ...templateData,
            updated_at: new Date()
          });
      } else {
        // Create new template
        await this.db('email_templates').insert({
          template_key: templateKey,
          ...templateData,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      return await this.getTemplate(templateKey);
    } catch (error) {
      console.error(`Error upserting template ${templateKey}:`, error);
      throw error;
    }
  }
}
