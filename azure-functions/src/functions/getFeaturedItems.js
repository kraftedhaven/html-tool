
import { app } from '@azure/functions';
import { getDatabaseService } from '../services/databaseService.js';

app.http('getFeaturedItems', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'featured-items',
  handler: async (request, context) => {
    try {
      const db = getDatabaseService();
      const featuredItems = await db.getFeaturedItems();

      return {
        status: 200,
        jsonBody: { featuredItems }
      };

    } catch (error) {
      context.log.error('Error fetching featured items:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch featured items', details: error.message }
      };
    }
  }
});
