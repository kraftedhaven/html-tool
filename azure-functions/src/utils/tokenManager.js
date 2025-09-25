import axios from 'axios';
import { keyVault } from './keyVault.js';

// eBay API Configuration
const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const EBAY_OAUTH_TOKEN_URL = `${EBAY_BASE}/identity/v1/oauth2/token`;

class TokenManager {
  constructor() {
    this.tokenCache = new Map();
  }

  async getEbayAccessToken() {
    const tokenName = 'ebay-access-token';
    
    // Check cache first (Redis or in-memory)
    const cachedToken = await keyVault.getToken(tokenName);
    if (cachedToken && cachedToken.token && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    // Get secrets from Key Vault
    const secrets = await keyVault.getSecrets([
      'ebay-client-id',
      'ebay-client-secret', 
      'ebay-refresh-token'
    ]);

    const credentials = Buffer.from(`${secrets['ebay-client-id']}:${secrets['ebay-client-secret']}`).toString('base64');

    try {
      console.log('Refreshing eBay access token...');
      const data = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: secrets['ebay-refresh-token'],
        scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/commerce.taxonomy.readonly'
      });
      
      const config = {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        timeout: 10000
      };

      const response = await axios.post(EBAY_OAUTH_TOKEN_URL, data, config);
      const { access_token, expires_in } = response.data;

      // Set the expiration time to be 5 minutes before the actual expiration
      const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
      const expiresAt = Date.now() + (expires_in * 1000) - buffer;
      
      const tokenData = {
        token: access_token,
        expiresAt: expiresAt
      };

      // Cache the token (Redis or in-memory)
      await keyVault.setToken(tokenName, tokenData, expires_in - 300); // 5 minutes buffer

      return access_token;
    } catch (error) {
      console.error('Error refreshing eBay token:', error.response ? error.response.data : error.message);
      throw new Error('Could not refresh eBay access token.');
    }
  }

  async getFacebookAccessToken() {
    const tokenName = 'facebook-access-token';
    
    // Check cache first
    const cachedToken = await keyVault.getToken(tokenName);
    if (cachedToken && cachedToken.token && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    try {
      // Get Facebook secrets from Key Vault
      const secrets = await keyVault.getSecrets([
        'facebook-app-id',
        'facebook-app-secret',
        'facebook-access-token',
        'facebook-refresh-token'
      ]);

      // If we have a refresh token, try to refresh the access token
      if (secrets['facebook-refresh-token']) {
        const refreshUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
        const params = new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: secrets['facebook-app-id'],
          client_secret: secrets['facebook-app-secret'],
          fb_exchange_token: secrets['facebook-access-token']
        });

        const response = await axios.post(refreshUrl, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000
        });

        const { access_token, expires_in } = response.data;
        
        if (access_token) {
          const expiresAt = Date.now() + (expires_in * 1000) - (5 * 60 * 1000); // 5 min buffer
          const tokenData = { token: access_token, expiresAt };
          
          // Cache the new token
          await keyVault.setToken(tokenName, tokenData, expires_in - 300);
          
          return access_token;
        }
      }

      // Fallback to stored token
      return secrets['facebook-access-token'];
    } catch (error) {
      console.error('Error refreshing Facebook token:', error.message);
      
      // Fallback to stored token from Key Vault
      const secrets = await keyVault.getSecrets(['facebook-access-token']);
      return secrets['facebook-access-token'];
    }
  }

  async getEtsyAccessToken() {
    const tokenName = 'etsy-access-token';
    
    // Check cache first
    const cachedToken = await keyVault.getToken(tokenName);
    if (cachedToken && cachedToken.token && Date.now() < cachedToken.expiresAt) {
      return cachedToken.token;
    }

    try {
      // Get Etsy secrets from Key Vault
      const secrets = await keyVault.getSecrets([
        'etsy-client-id',
        'etsy-client-secret',
        'etsy-access-token',
        'etsy-refresh-token'
      ]);

      // If we have a refresh token, try to refresh the access token
      if (secrets['etsy-refresh-token']) {
        const refreshUrl = 'https://api.etsy.com/v3/public/oauth/token';
        const credentials = Buffer.from(`${secrets['etsy-client-id']}:${secrets['etsy-client-secret']}`).toString('base64');
        
        const data = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: secrets['etsy-refresh-token']
        });

        const response = await axios.post(refreshUrl, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          },
          timeout: 10000
        });

        const { access_token, expires_in, refresh_token } = response.data;
        
        if (access_token) {
          const expiresAt = Date.now() + (expires_in * 1000) - (5 * 60 * 1000); // 5 min buffer
          const tokenData = { 
            token: access_token, 
            expiresAt,
            refreshToken: refresh_token 
          };
          
          // Cache the new token
          await keyVault.setToken(tokenName, tokenData, expires_in - 300);
          
          // Update the refresh token in Key Vault if it changed
          if (refresh_token && refresh_token !== secrets['etsy-refresh-token']) {
            // Note: In production, you'd want to update the Key Vault secret
            console.log('New Etsy refresh token received - should update Key Vault');
          }
          
          return access_token;
        }
      }

      // Fallback to stored token
      return secrets['etsy-access-token'];
    } catch (error) {
      console.error('Error refreshing Etsy token:', error.message);
      
      // Fallback to stored token from Key Vault
      const secrets = await keyVault.getSecrets(['etsy-access-token']);
      return secrets['etsy-access-token'];
    }
  }

  async updateSecret(secretName, secretValue) {
    try {
      if (keyVault.client) {
        await keyVault.client.setSecret(secretName, secretValue);
        console.log(`Updated secret: ${secretName}`);
        
        // Clear cache for this secret to force refresh
        await keyVault.clearCache();
      } else {
        console.warn('Key Vault client not available - cannot update secret');
      }
    } catch (error) {
      console.error(`Failed to update secret ${secretName}:`, error.message);
      throw error;
    }
  }

  async clearAllTokens() {
    await keyVault.clearCache();
    this.tokenCache.clear();
  }
}

export const tokenManager = new TokenManager();