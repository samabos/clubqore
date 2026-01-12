/**
 * Membership Tier Routes
 *
 * Routes for managing club membership tiers.
 * All routes require authentication and club manager role.
 */

import { MembershipTierController } from '../controllers/MembershipTierController.js';

// Validation schemas
const tierSchema = {
  type: 'object',
  required: ['name', 'monthlyPrice'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 1000 },
    monthlyPrice: { type: 'number', minimum: 0 },
    annualPrice: { type: 'number', minimum: 0 },
    billingFrequency: { type: 'string', enum: ['monthly', 'annual'] },
    features: {
      type: 'array',
      items: { type: 'string' }
    },
    isActive: { type: 'boolean' }
  }
};

const updateTierSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    description: { type: 'string', maxLength: 1000 },
    monthlyPrice: { type: 'number', minimum: 0 },
    annualPrice: { type: 'number', minimum: 0 },
    billingFrequency: { type: 'string', enum: ['monthly', 'annual'] },
    features: {
      type: 'array',
      items: { type: 'string' }
    },
    isActive: { type: 'boolean' }
  }
};

const reorderSchema = {
  type: 'object',
  required: ['tierIds'],
  properties: {
    tierIds: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      minItems: 1
    }
  }
};

/**
 * Register membership tier routes
 *
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 * @param {Function} options.authenticate - Authentication middleware
 */
export async function membershipTierRoutes(fastify, options) {
  const { authenticate } = options;
  const controller = new MembershipTierController(fastify.db);

  // Get tier statistics (must be before /:tierId route)
  fastify.get('/stats', {
    preHandler: authenticate,
    schema: {
      description: 'Get membership tier statistics',
      tags: ['Membership Tiers'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  monthlyPrice: { type: 'number' },
                  annualPrice: { type: 'number' },
                  isActive: { type: 'boolean' },
                  subscriptionCount: { type: 'integer' },
                  monthlyRevenue: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.getTierStats(request, reply));

  // Reorder tiers (must be before /:tierId route)
  fastify.put('/reorder', {
    preHandler: authenticate,
    schema: {
      description: 'Reorder membership tiers',
      tags: ['Membership Tiers'],
      body: reorderSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  sortOrder: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.reorderTiers(request, reply));

  // Get all tiers
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      description: 'Get all membership tiers for the club',
      tags: ['Membership Tiers'],
      querystring: {
        type: 'object',
        properties: {
          activeOnly: { type: 'string', enum: ['true', 'false'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  clubId: { type: 'integer' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  monthlyPrice: { type: 'number' },
                  annualPrice: { type: 'number' },
                  billingFrequency: { type: 'string' },
                  features: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                  sortOrder: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.getTiers(request, reply));

  // Create tier
  fastify.post('/', {
    preHandler: authenticate,
    schema: {
      description: 'Create a new membership tier',
      tags: ['Membership Tiers'],
      body: tierSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                clubId: { type: 'integer' },
                name: { type: 'string' },
                description: { type: 'string' },
                monthlyPrice: { type: 'number' },
                annualPrice: { type: 'number' },
                billingFrequency: { type: 'string' },
                features: { type: 'array', items: { type: 'string' } },
                isActive: { type: 'boolean' },
                sortOrder: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, (request, reply) => controller.createTier(request, reply));

  // Get single tier
  fastify.get('/:tierId', {
    preHandler: authenticate,
    schema: {
      description: 'Get a membership tier by ID',
      tags: ['Membership Tiers'],
      params: {
        type: 'object',
        required: ['tierId'],
        properties: {
          tierId: { type: 'integer' }
        }
      }
    }
  }, (request, reply) => controller.getTier(request, reply));

  // Update tier
  fastify.put('/:tierId', {
    preHandler: authenticate,
    schema: {
      description: 'Update a membership tier',
      tags: ['Membership Tiers'],
      params: {
        type: 'object',
        required: ['tierId'],
        properties: {
          tierId: { type: 'integer' }
        }
      },
      body: updateTierSchema
    }
  }, (request, reply) => controller.updateTier(request, reply));

  // Delete tier
  fastify.delete('/:tierId', {
    preHandler: authenticate,
    schema: {
      description: 'Delete a membership tier',
      tags: ['Membership Tiers'],
      params: {
        type: 'object',
        required: ['tierId'],
        properties: {
          tierId: { type: 'integer' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          force: { type: 'string', enum: ['true', 'false'] }
        }
      }
    }
  }, (request, reply) => controller.deleteTier(request, reply));
}

export default membershipTierRoutes;
