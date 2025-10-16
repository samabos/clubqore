export const accountRoutes = async function (fastify, options) {
  const { accountController, authenticate } = options;

  // Apply authentication middleware to all routes
  if (authenticate) {
    fastify.addHook('onRequest', authenticate);
  }

  // Generate account number (internal use)
  fastify.post('/generate', {
    schema: {
      tags: ['Accounts'],
      summary: 'Generate account number (internal use)',
      body: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['club_manager', 'member', 'parent'] },
          clubId: { type: 'integer' }
        }
      }
    }
  }, accountController.generateAccountNumber.bind(accountController));

  // Get account details by account number
  fastify.get('/:accountNumber', {
    schema: {
      tags: ['Accounts'],
      summary: 'Get account details by account number',
      params: {
        type: 'object',
        properties: {
          accountNumber: { type: 'string', pattern: '^CQ\\d{9}$' }
        }
      }
    }
  }, accountController.getAccountByNumber.bind(accountController));

  // Search accounts
  fastify.get('/search', {
    schema: {
      tags: ['Accounts'],
      summary: 'Search accounts',
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 2 },
          role: { type: 'string', enum: ['club_manager', 'member', 'parent'] }
        }
      }
    }
  }, accountController.searchAccounts.bind(accountController));
};
