import functions from 'firebase-functions';
import cors from 'cors';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: functions.config().openai.key });

const corsHandler = cors({ origin: true });

export const getInsights = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const { title, description, categoryName } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'A "title" is required to get insights.' });
        }

        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert eBay market analyst bot for the 'html-tool' application. Your goal is to provide actionable insights to help sellers improve their listings and sales strategy. Be concise and provide data-driven advice where possible.`
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
            res.json({ success: true, insights });
        } catch (error) {
            console.error('An unexpected error occurred:', error);
            res.status(500).json({ error: error.message || 'An internal server error occurred.' });
        }
    });
});
