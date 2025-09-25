import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import Redis from 'ioredis';

class KeyVaultManager {
  constructor() {
    this.vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    this.credential = new DefaultAzureCredential();
    this.client = this.vaultUrl ? new SecretClient(this.vaultUrl, this.credential) : null;
    
    // In-memory cache as fallback
    this.cache = new Map();
    this.cacheExpiry = new Map();
    
    // Azure Redis Cache for token storage
    this.redis = null;
    this.initRedis();
  }

  async initRedis() {
    try {
      const redisConnectionString = process.env.AZURE_REDIS_CONNECTION_STRING;
      if (redisConnectionString) {
        this.redis = new Redis(redisConnectionString, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });
        
        this.redis.on('error', (err) => {
          console.warn('Redis connection error, falling back to in-memory cache:', err.message);
          this.redis = null;
        });
        
        await this.redis.connect();
        console.log('Connected to Azure Redis Cache');
      }
    } catch (error) {
      console.warn('Failed to initialize Redis, using in-memory cache:', error.message);
      this.redis = null;
    }
  }

  async getSecret(secretName) {
    // Try Redis cache first
    if (this.redis) {
      try {
        const cachedValue = await this.redis.get(`secret:${secretName}`);
        if (cachedValue) {
          return cachedValue;
        }
      } catch (error) {
        console.warn('Redis get error, falling back:', error.message);
      }
    }

    // Return from in-memory cache if valid
    if (this.cache.has(secretName) && Date.now() < this.cacheExpiry.get(secretName)) {
      return this.cache.get(secretName);
    }

    try {
      if (!this.client) {
        // Fallback to environment variables if Key Vault is not configured
        console.warn(`Key Vault not configured, falling back to environment variable: ${secretName}`);
        return process.env[secretName.toUpperCase().replace(/-/g, '_')];
      }

      const secret = await this.client.getSecret(secretName);
      const value = secret.value;

      // Cache in Redis for 5 minutes
      if (this.redis) {
        try {
          await this.redis.setex(`secret:${secretName}`, 300, value);
        } catch (error) {
          console.warn('Redis set error:', error.message);
        }
      }

      // Cache in memory for 5 minutes as fallback
      this.cache.set(secretName, value);
      this.cacheExpiry.set(secretName, Date.now() + 5 * 60 * 1000);

      return value;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error.message);
      // Fallback to environment variables
      return process.env[secretName.toUpperCase().replace(/-/g, '_')];
    }
  }

  async getSecrets(secretNames) {
    const promises = secretNames.map(name => this.getSecret(name));
    const values = await Promise.all(promises);
    
    const result = {};
    secretNames.forEach((name, index) => {
      result[name] = values[index];
    });
    
    return result;
  }

  async setToken(tokenName, tokenData, expiresInSeconds) {
    const tokenKey = `token:${tokenName}`;
    
    // Store in Redis if available
    if (this.redis) {
      try {
        await this.redis.setex(tokenKey, expiresInSeconds, JSON.stringify(tokenData));
        return;
      } catch (error) {
        console.warn('Redis token set error:', error.message);
      }
    }
    
    // Fallback to in-memory cache
    this.cache.set(tokenKey, tokenData);
    this.cacheExpiry.set(tokenKey, Date.now() + (expiresInSeconds * 1000));
  }

  async getToken(tokenName) {
    const tokenKey = `token:${tokenName}`;
    
    // Try Redis first
    if (this.redis) {
      try {
        const cachedToken = await this.redis.get(tokenKey);
        if (cachedToken) {
          return JSON.parse(cachedToken);
        }
      } catch (error) {
        console.warn('Redis token get error:', error.message);
      }
    }
    
    // Try in-memory cache
    if (this.cache.has(tokenKey) && Date.now() < this.cacheExpiry.get(tokenKey)) {
      return this.cache.get(tokenKey);
    }
    
    return null;
  }

  async clearCache() {
    // Clear Redis cache
    if (this.redis) {
      try {
        const keys = await this.redis.keys('secret:*');
        const tokenKeys = await this.redis.keys('token:*');
        const allKeys = [...keys, ...tokenKeys];
        if (allKeys.length > 0) {
          await this.redis.del(...allKeys);
        }
      } catch (error) {
        console.warn('Redis clear error:', error.message);
      }
    }
    
    // Clear in-memory cache
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  async setSecret(secretName, secretValue) {
    try {
      if (!this.client) {
        throw new Error('Key Vault client not configured');
      }

      await this.client.setSecret(secretName, secretValue);
      
      // Clear cache for this secret
      const secretKey = `secret:${secretName}`;
      
      if (this.redis) {
        try {
          await this.redis.del(secretKey);
        } catch (error) {
          console.warn('Redis delete error:', error.message);
        }
      }
      
      this.cache.delete(secretKey);
      this.cacheExpiry.delete(secretKey);
      
      console.log(`Secret ${secretName} updated successfully`);
    } catch (error) {
      console.error(`Failed to set secret ${secretName}:`, error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}

export const keyVault = new KeyVaultManager();