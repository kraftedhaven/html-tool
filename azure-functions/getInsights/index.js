const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function (context, req) {
    context.log('Get Insights function processing a request.');

    const { title, description, categoryName } = req.body;

    if (!title) {
        context.res = { status: 400, body: { error: 'A "title" is required to get insights.' } };
        return;
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
        context.res = { status: 200, body: { success: true, insights } };
    } catch (error) {
        context.log.error('An unexpected error occurred:', error);
        context.res = { status: 500, body: { error: error.message || 'An internal server error occurred.' } };
    }
};
