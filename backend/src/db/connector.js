import fastifyPlugin from 'fastify-plugin'
import knex from 'knex';

async function dbConnector(fastify, options) {
  if (!fastify.db) {
    const knexInstance = knex(options)
    fastify.decorate('db', knexInstance)

    fastify.addHook('onClose', async (fastify) => {
      if (fastify.db) {
        await fastify.db.destroy()
      }
    })
  }
}

export default fastifyPlugin(dbConnector)