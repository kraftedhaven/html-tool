const axios = require('axios');

const EBAY_ENV = process.env.EBAY_ENV || 'production';
const EBAY_BASE = EBAY_ENV === 'production' ? 'https://api.ebay.com' : 'https://api.sandbox.ebay.com';
const EBAY_OAUTH_TOKEN_URL = `${EBAY_BASE}/identity/v1/oauth2/token`;

let ebayTokenCache = {
    token: null,
    expiresAt: 0,
};

async function getEbayAccessToken() {
    if (ebayTokenCache.token && Date.now() < ebayTokenCache.expiresAt) {
        return ebayTokenCache.token;
    }

    const { EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_REFRESH_TOKEN } = process.env;
    const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

    try {
        console.log('Refreshing eBay access token...');
        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: EBAY_REFRESH_TOKEN,
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

        const buffer = 5 * 60 * 1000; // 5 minutes
        ebayTokenCache.token = access_token;
        ebayTokenCache.expiresAt = Date.now() + (expires_in * 1000) - buffer;

        return access_token;
    } catch (error) {
        console.error('Error refreshing eBay token:', error.response ? error.response.data : error.message);
        throw new Error('Could not refresh eBay access token.');
    }
}

module.exports = { getEbayAccessToken };
