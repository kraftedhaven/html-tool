import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

class KeyVaultManager {
  constructor() {
    this.vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    this.credential = new DefaultAzureCredential();
    this.client = this.vaultUrl ? new SecretClient(this.vaultUrl, this.credential) : null;
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  async getSecret(secretName) {
    // Return from cache if valid
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

      // Cache for 5 minutes
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

  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

export const keyVault = new KeyVaultManager();