
import jwt from 'jsonwebtoken';
import { getKeyVaultSecret } from '../utils/keyVault.js';
import { getDatabaseService } from '../services/databaseService.js';

const dbService = getDatabaseService();

// Admin user IDs (in production, this should be in database)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];

export async function authenticateUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
    const decoded = jwt.verify(token, jwtSecret);
    return await dbService.getUserById(decoded.userId);
  } catch (error) {
    return null;
  }
}

export async function verifyAdminAccess(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Authorization header required', status: 401 };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
    const decoded = jwt.verify(token, jwtSecret);

    if (!ADMIN_USER_IDS.includes(decoded.userId)) {
      return { error: 'Admin access required', status: 403 };
    }

    return { userId: decoded.userId };
  } catch (error) {
    return { error: 'Invalid token', status: 401 };
  }
}
