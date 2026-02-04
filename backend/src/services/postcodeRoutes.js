/**
 * @deprecated OBSOLETE - This file has been moved to shared/routes/
 * This file is kept temporarily for reference and can be safely deleted.
 * New location: backend/src/shared/routes/postcodeRoutes.js
 */
import { postcodeService } from './postcodeService.js';

/**
 * Register postcode-related routes
 */
export async function postcodeRoutes(fastify, options) {
  // GET /api/postcodes/lookup/:postcode - Full address lookup
  fastify.get('/api/postcodes/lookup/:postcode', {
    schema: {
      description: 'Lookup full address details for a UK postcode',
      tags: ['postcodes'],
      params: {
        type: 'object',
        required: ['postcode'],
        properties: {
          postcode: {
            type: 'string',
            description: 'UK postcode (e.g., SW1A 1AA)',
            minLength: 5,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            county: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        503: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { postcode } = request.params;
      const address = await postcodeService.lookupPostcode(postcode);
      return reply.code(200).send(address);
    } catch (error) {
      if (error.message === 'Invalid postcode format') {
        return reply.code(400).send({ error: error.message });
      }

      if (error.message === 'Postcode not found') {
        return reply.code(404).send({ error: error.message });
      }

      if (error.message.includes('unavailable') || error.message.includes('timed out')) {
        return reply.code(503).send({ error: 'Postcode lookup service is temporarily unavailable' });
      }

      request.log.error('Postcode lookup error:', error);
      return reply.code(500).send({ error: 'An error occurred during postcode lookup' });
    }
  });

  // GET /api/postcodes/autocomplete/:partial - Autocomplete suggestions
  fastify.get('/api/postcodes/autocomplete/:partial', {
    schema: {
      description: 'Get autocomplete suggestions for a partial UK postcode',
      tags: ['postcodes'],
      params: {
        type: 'object',
        required: ['partial'],
        properties: {
          partial: {
            type: 'string',
            description: 'Partial UK postcode (e.g., SW1A)',
            minLength: 2,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { partial } = request.params;
      const suggestions = await postcodeService.autocompletePostcode(partial);
      return reply.code(200).send({ suggestions });
    } catch (error) {
      request.log.error('Postcode autocomplete error:', error);
      // Return empty array on errors (better UX)
      return reply.code(200).send({ suggestions: [] });
    }
  });

  // GET /api/postcodes/validate/:postcode - Validate postcode
  fastify.get('/api/postcodes/validate/:postcode', {
    schema: {
      description: 'Validate if a UK postcode exists',
      tags: ['postcodes'],
      params: {
        type: 'object',
        required: ['postcode'],
        properties: {
          postcode: {
            type: 'string',
            description: 'UK postcode to validate',
            minLength: 5,
            maxLength: 10
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            postcode: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { postcode } = request.params;
      const isValid = await postcodeService.validatePostcode(postcode);
      const normalized = postcodeService.normalizePostcode(postcode);

      return reply.code(200).send({
        valid: isValid,
        postcode: normalized
      });
    } catch (error) {
      request.log.error('Postcode validation error:', error);
      return reply.code(200).send({
        valid: false,
        postcode: request.params.postcode
      });
    }
  });

  // GET /api/postcodes/search/:searchTerm - Address autocomplete with house numbers (getAddress.io)
  fastify.get('/api/postcodes/search/:searchTerm', {
    schema: {
      description: 'Search for UK addresses with autocomplete including house numbers',
      tags: ['postcodes'],
      params: {
        type: 'object',
        required: ['searchTerm'],
        properties: {
          searchTerm: {
            type: 'string',
            description: 'Search term (postcode or street address)',
            minLength: 3,
            maxLength: 100
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  id: { type: 'string' },
                  url: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { searchTerm } = request.params;
      const suggestions = await postcodeService.searchAddresses(searchTerm);
      return reply.code(200).send({ suggestions });
    } catch (error) {
      request.log.error('Address search error:', error);
      // Return empty array on errors (better UX for autocomplete)
      return reply.code(200).send({ suggestions: [] });
    }
  });

  // GET /api/postcodes/address/:addressId - Get full address details (getAddress.io)
  fastify.get('/api/postcodes/address/:addressId', {
    schema: {
      description: 'Get full address details by ID from getAddress.io',
      tags: ['postcodes'],
      params: {
        type: 'object',
        required: ['addressId'],
        properties: {
          addressId: {
            type: 'string',
            description: 'Address ID from autocomplete suggestion'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            county: { type: 'string' },
            postcode: { type: 'string' },
            country: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        503: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { addressId } = request.params;
      const address = await postcodeService.getFullAddress(addressId);
      return reply.code(200).send(address);
    } catch (error) {
      if (error.message === 'Address not found') {
        return reply.code(404).send({ error: error.message });
      }

      if (error.message.includes('unavailable') || error.message.includes('timed out')) {
        return reply.code(503).send({ error: 'Address lookup service is temporarily unavailable' });
      }

      request.log.error('Address retrieval error:', error);
      return reply.code(500).send({ error: 'An error occurred retrieving the address' });
    }
  });
}
