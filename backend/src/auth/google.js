import fp from 'fastify-plugin';
import oauth2 from '@fastify/oauth2';

export default fp(async (fastify) => {
  fastify.register(oauth2, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/auth/google',
    callbackUri: 'http://localhost:3000/auth/google/callback',
  });

  fastify.get('/auth/google/callback', async (req, reply) => {
    const token = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
    // Fetch Google profile and issue your own JWT
    // Use token.access_token to fetch user info
    return reply.send({ token });
  });
});
