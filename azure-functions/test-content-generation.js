/**
 * Test Content Generation Workflows
 * Tests the enhanced content generation workflows for SEO blog content, FAQ enrichment, and intelligent web queries
 */

import { contentGenerationWorkflows } from './src/utils/contentGenerationWorkflows.js';
import { workflowEngine } from './src/utils/workflowEngine.js';

async function testSEOBlogContentGeneration() {
    console.log('📝 Testing SEO Blog Content Generation...\n');

    try {
        const inputData = {
            topic: 'Vintage Leather Jacket Care and Styling Guide',
            targetKeywords: ['vintage leather jacket', 'leather care', 'vintage fashion'],
            productContext: {
                productType: 'Leather Jacket',
                brand: 'Vintage Brand',
                material: 'Genuine Leather',
                estimatedYear: 1985,
                condition: 'Excellent'
            },
            contentLength: 'medium'
        };

        console.log('Input Data:', JSON.stringify(inputData, null, 2));

        const results = await contentGenerationWorkflows.generateSEOBlogContent(inputData);

        console.log('✅ SEO Blog Content Results:');
        console.log('  - Title:', results.title);
        console.log('  - Word Count:', results.wordCount);
        console.log('  - Reading Time:', results.readingTime, 'minutes');
        console.log('  - SEO Score:', results.seoScore);
        console.log('  - Keywords Count:', results.keywords?.length || 0);
        console.log('  - Meta Description:', results.metaDescription?.substring(0, 100) + '...');
        console.log('  - Content Preview:', results.content?.substring(0, 200) + '...');

        return results;

    } catch (error) {
        console.error('❌ SEO Blog Content Generation failed:', error);
        throw error;
    }
}

async function testFAQEnrichment() {
    console.log('\n❓ Testing FAQ Enrichment...\n');

    try {
        const inputData = {
            productData: {
                productType: 'Vintage Leather Jacket',
                brand: 'Classic Leather Co',
                size: 'Medium',
                material: 'Genuine Leather',
                condition: 'Excellent',
                estimatedYear: 1985,
                color: { primary: 'Brown', secondary: 'Black' },
                keyFeatures: 'Vintage style, genuine leather, classic brown color'
            },
            existingFAQs: [
                {
                    question: 'What size is this jacket?',
                    answer: 'This jacket is size Medium.'
                }
            ],
            customerQuestions: [
                'How do I care for vintage leather?',
                'Is this jacket authentic?',
                'What is the return policy?'
            ],
            competitorFAQs: [
                {
                    question: 'How do you authenticate vintage items?',
                    answer: 'We use expert authentication processes.'
                }
            ]
        };

        console.log('Input Data:', JSON.stringify(inputData, null, 2));

        const results = await contentGenerationWorkflows.enrichFAQSections(inputData);

        console.log('✅ FAQ Enrichment Results:');
        console.log('  - Total Questions:', results.totalQuestions);
        console.log('  - Categories:', Object.keys(results.categories || {}));
        console.log('  - SEO Keywords Count:', results.seoKeywords?.length || 0);
        console.log('  - Coverage Percentage:', results.coverage?.percentage || 0, '%');
        console.log('  - Sample FAQ:');
        if (results.faqSections && results.faqSections.length > 0) {
            console.log('    Q:', results.faqSections[0].question);
            console.log('    A:', results.faqSections[0].answer?.substring(0, 100) + '...');
        }

        return results;

    } catch (error) {
        console.error('❌ FAQ Enrichment failed:', error);
        throw error;
    }
}

async function testIntelligentWebQuery() {
    console.log('\n🔍 Testing Intelligent Web Query and Semantic Re-Ranking...\n');

    try {
        const inputData = {
            query: 'vintage leather jacket market trends 2024',
            sources: ['google', 'bing'],
            relevanceCriteria: 'vintage fashion market analysis and pricing trends',
            maxResults: 10,
            semanticFilters: ['market trends', 'pricing', 'vintage fashion']
        };

        console.log('Input Data:', JSON.stringify(inputData, null, 2));

        const results = await contentGenerationWorkflows.intelligentWebQueryAndRanking(inputData);

        console.log('✅ Intelligent Web Query Results:');
        console.log('  - Total Results:', results.totalResults);
        console.log('  - Ranked Results Count:', results.rankedResults?.length || 0);
        console.log('  - Semantic Score:', results.semanticScore);
        console.log('  - Sources:', results.sources);
        console.log('  - Market Trends:', results.insights?.marketTrends || 'Not available');
        console.log('  - Opportunities:', results.insights?.opportunities || 'Not available');
        console.log('  - Sample Result:');
        if (results.rankedResults && results.rankedResults.length > 0) {
            const sample = results.rankedResults[0];
            console.log('    Title:', sample.title);
            console.log('    Source:', sample.source);
            console.log('    Relevance Score:', sample.relevanceScore);
        }

        return results;

    } catch (error) {
        console.error('❌ Intelligent Web Query failed:', error);
        throw error;
    }
}

async function testWorkflowEngineIntegration() {
    console.log('\n🔧 Testing Workflow Engine Integration...\n');

    try {
        await workflowEngine.initialize();

        // Test SEO blog content workflow through engine
        console.log('Testing SEO blog content workflow through engine...');
        const blogResults = await workflowEngine.executeWorkflow('seo-blog-content', {
            topic: 'Vintage Fashion Trends 2024',
            targetKeywords: ['vintage fashion', 'retro style', '2024 trends'],
            contentLength: 'short'
        });

        console.log('✅ Workflow Engine Blog Results:');
        console.log('  - Keywords Generated:', blogResults.keywordData?.totalKeywords || 0);
        console.log('  - Content Structure:', blogResults.contentStructure?.sections?.length || 0, 'sections');

        // Test FAQ enrichment workflow through engine
        console.log('\nTesting FAQ enrichment workflow through engine...');
        const faqResults = await workflowEngine.executeWorkflow('faq-enrichment', {
            productData: {
                productType: 'Vintage Dress',
                brand: 'Retro Chic',
                size: 'Small',
                material: 'Silk',
                estimatedYear: 1960
            },
            existingFAQs: [],
            customerQuestions: ['What is the fabric?', 'How should I wash this?']
        });

        console.log('✅ Workflow Engine FAQ Results:');
        console.log('  - Product Questions Generated:', faqResults.productQuestions?.length || 0);
        console.log('  - Enriched FAQs:', faqResults.enrichedFAQs?.length || 0);

        // Test market intelligence workflow through engine
        console.log('\nTesting market intelligence workflow through engine...');
        const intelligenceResults = await workflowEngine.executeWorkflow('market-intelligence', {
            searchQuery: 'vintage clothing resale market 2024',
            sources: ['google', 'bing'],
            relevanceCriteria: 'resale market analysis',
            maxResults: 8
        });

        console.log('✅ Workflow Engine Intelligence Results:');
        console.log('  - Raw Results:', intelligenceResults.rawResults?.length || 0);
        console.log('  - Semantic Analysis Score:', intelligenceResults.semanticAnalysis?.overallScore || 0);
        console.log('  - Competitive Insights:', intelligenceResults.competitiveInsights ? 'Generated' : 'Not generated');

        return { blogResults, faqResults, intelligenceResults };

    } catch (error) {
        console.error('❌ Workflow Engine Integration failed:', error);
        throw error;
    }
}

async function testBatchContentGeneration() {
    console.log('\n📦 Testing Batch Content Generation...\n');

    try {
        const products = [
            {
                id: 'prod1',
                productType: 'Vintage Jacket',
                brand: 'Leather Co',
                material: 'Leather'
            },
            {
                id: 'prod2',
                productType: 'Vintage Dress',
                brand: 'Fashion House',
                material: 'Silk'
            },
            {
                id: 'prod3',
                productType: 'Vintage Shoes',
                brand: 'Classic Footwear',
                material: 'Leather'
            }
        ];

        console.log('Processing', products.length, 'products...');

        const results = [];
        for (const product of products) {
            try {
                // Generate blog content for each product
                const blogContent = await contentGenerationWorkflows.generateSEOBlogContent({
                    topic: `${product.productType} ${product.brand} Guide`,
                    targetKeywords: [product.productType, product.brand],
                    productContext: product,
                    contentLength: 'short'
                });

                // Generate FAQ content for each product
                const faqContent = await contentGenerationWorkflows.enrichFAQSections({
                    productData: product,
                    existingFAQs: [],
                    customerQuestions: [`What material is the ${product.productType}?`]
                });

                results.push({
                    productId: product.id,
                    productType: product.productType,
                    blogContent: {
                        title: blogContent.title,
                        wordCount: blogContent.wordCount,
                        seoScore: blogContent.seoScore
                    },
                    faqContent: {
                        totalQuestions: faqContent.totalQuestions,
                        coverage: faqContent.coverage?.percentage || 0
                    },
                    status: 'success'
                });

            } catch (productError) {
                console.error(`Failed to process product ${product.id}:`, productError.message);
                results.push({
                    productId: product.id,
                    status: 'error',
                    error: productError.message
                });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        console.log('✅ Batch Content Generation Results:');
        console.log('  - Total Products:', products.length);
        console.log('  - Successful:', successCount);
        console.log('  - Failed:', errorCount);
        console.log('  - Success Rate:', ((successCount / products.length) * 100).toFixed(1) + '%');

        results.forEach(result => {
            if (result.status === 'success') {
                console.log(`  - ${result.productId}: Blog (${result.blogContent.wordCount} words, SEO: ${result.blogContent.seoScore}), FAQ (${result.faqContent.totalQuestions} questions)`);
            } else {
                console.log(`  - ${result.productId}: ERROR - ${result.error}`);
            }
        });

        return results;

    } catch (error) {
        console.error('❌ Batch Content Generation failed:', error);
        throw error;
    }
}

// Run all tests
async function runAllContentGenerationTests() {
    console.log('🧪 Starting Content Generation Workflow Tests\n');
    console.log('=' .repeat(60));

    try {
        const blogResults = await testSEOBlogContentGeneration();
        const faqResults = await testFAQEnrichment();
        const webQueryResults = await testIntelligentWebQuery();
        const engineResults = await testWorkflowEngineIntegration();
        const batchResults = await testBatchContentGeneration();

        console.log('\n' + '='.repeat(60));
        console.log('🎯 All Content Generation Tests Completed Successfully!');
        console.log('\n📊 Summary:');
        console.log('  - SEO Blog Content: ✅ Generated');
        console.log('  - FAQ Enrichment: ✅ Generated');
        console.log('  - Intelligent Web Query: ✅ Executed');
        console.log('  - Workflow Engine Integration: ✅ Working');
        console.log('  - Batch Processing: ✅ Completed');

        return {
            blogResults,
            faqResults,
            webQueryResults,
            engineResults,
            batchResults
        };

    } catch (error) {
        console.error('❌ Content Generation Tests failed:', error);
        process.exit(1);
    }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllContentGenerationTests().catch(console.error);
}

export { 
    testSEOBlogContentGeneration,
    testFAQEnrichment,
    testIntelligentWebQuery,
    testWorkflowEngineIntegration,
    testBatchContentGeneration,
    runAllContentGenerationTests
};