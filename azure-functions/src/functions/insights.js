import { app } from '@azure/functions';
import { OpenAI } from 'openai';
import { keyVault } from '../utils/keyVault.js';

app.http('insights', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const { title, description, categoryName } = await request.json();

            if (!title) {
                return {
                    status: 400,
                    jsonBody: { error: 'A "title" is required to get insights.' }
                };
            }

            // Get OpenAI API key from Key Vault
            const openaiApiKey = await keyVault.getSecret('openai-api-key');
            const openai = new OpenAI({ apiKey: openaiApiKey });

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert eBay market analyst bot for the 'Neural Listing Engine' application. Your goal is to provide actionable insights to help sellers improve their listings and sales strategy. Be concise and provide data-driven advice where possible.`
                    },
                    {
                        role: 'user',
                        content: `I am analyzing a product to list on eBay. Here are the details:
- Title: "${title}"
- Description: "${description || 'Not provided.'}"
- Category: "${categoryName || 'Not provided.'}"

Please provide some quick insights. Specifically:
1.  **Keyword Suggestions:** What are 3-5 alternative or additional keywords I should consider for the title to improve search visibility?
2.  **Pricing Insight:** What is a common pricing strategy for this type of item (e.g., auction vs. fixed price, competitive pricing)?
3.  **Listing Improvement:** Suggest one key improvement for the description to build buyer confidence.`
                    }
                ],
                temperature: 0.6,
                max_tokens: 400,
            });

            const insights = completion.choices[0].message.content;

            return {
                status: 200,
                jsonBody: { success: true, insights }
            };

        } catch (error) {
            console.error('Error in insights function:', error);
            return {
                status: 500,
                jsonBody: { error: error.message || 'An internal server error occurred.' }
            };
        }
    }
});