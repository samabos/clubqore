import { emailService } from '../../../services/emailService.js';

describe('EmailService (mock in test)', () => {
  test('sendEmail returns a messageId in test mode', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'Plain text',
      html: '<p>HTML</p>'
    });

    expect(result).toBeDefined();
    expect(result.messageId).toBeDefined();
  });
});




