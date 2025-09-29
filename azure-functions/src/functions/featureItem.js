
import { app } from '@azure/functions';
import { getDatabaseService } from '../services/databaseService.js';
import { verifyAdminAccess } from '../middleware/auth.js';

app.http('featureItem', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'featured-items',
  handler: async (request, context) => {
    try {
      const authResult = await verifyAdminAccess(request);
      if (authResult.error) {
        return {
          status: authResult.status,
          jsonBody: { error: authResult.error }
        };
      }

      const listing = await request.json();

      const db = getDatabaseService();
      const featuredItem = await db.createFeaturedItem(listing);

      return {
        status: 201,
        jsonBody: { featuredItem }
      };

    } catch (error) {
      context.log.error('Error featuring item:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to feature item', details: error.message }
      };
    }
  }
});
