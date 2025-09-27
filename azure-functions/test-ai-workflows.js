/**
 * Test AI Automation Workflows
 * Tests the workflow execution engine and specific workflow implementations
 */

import { workflowEngine } from './src/utils/workflowEngine.js';

async function testWorkflowEngine() {
    console.log('🚀 Testing AI Automation Workflow Engine...\n');

    try {
        // Initialize the workflow engine
        await workflowEngine.initialize();
        console.log('✅ Workflow engine initialized successfully');

        // Test 1: List available workflows
        console.log('\n📋 Available Workflows:');
        const workflows = workflowEngine.getWorkflowList();
        workflows.forEach(workflow => {
            const details = workflowEngine.getWorkflowDetails(workflow);
            console.log(`  - ${workflow}: ${details.name}`);
        });

        // Test 2: Execute Product Research SEO Workflow
        console.log('\n🔍 Testing AI-Powered Product Research SEO Content Automation...');
        const productResearchInput = {
            productImages: ['https://example.com/vintage-jacket.jpg'],
            productDescription: 'Vintage leather jacket from the 1980s, brown color, size medium'
        };

        const productResearchResults = await workflowEngine.executeWorkflow(
            'product-research-seo', 
            productResearchInput
        );
        
        console.log('✅ Product Research SEO Results:');
        console.log('  - Product Data:', JSON.stringify(productResearchResults.productData, null, 2));
        console.log('  - SEO Keywords:', productResearchResults.seoKeywords);
        console.log('  - SEO Title:', productResearchResults.seoTitle);

        // Test 3: Execute Competitor Monitoring Workflow
        console.log('\n💰 Testing Competitor Price Monitoring...');
        const competitorInput = {
            productKeywords: ['vintage leather jacket', 'brown leather jacket', '1980s jacket'],
            marketplaces: ['ebay', 'facebook', 'etsy'],
            productData: productResearchResults.productData
        };

        const competitorResults = await workflowEngine.executeWorkflow(
            'competitor-monitoring',
            competitorInput
        );

        console.log('✅ Competitor Monitoring Results:');
        console.log('  - Price Range:', competitorResults.priceRange);
        console.log('  - Market Trends:', competitorResults.marketTrends);
        console.log('  - Pricing Recommendations:', competitorResults.pricingRecommendations);

        // Test 4: Execute Content Generation Workflow
        console.log('\n📝 Testing SEO Content Generation...');
        const contentInput = {
            topic: 'Vintage Fashion Trends 2024',
            targetAudience: 'vintage fashion enthusiasts',
            productData: productResearchResults.productData
        };

        const contentResults = await workflowEngine.executeWorkflow(
            'content-generation',
            contentInput
        );

        console.log('✅ Content Generation Results:');
        console.log('  - Keywords:', contentResults.keywords?.slice(0, 3));
        console.log('  - Blog Content Length:', contentResults.blogContent?.length || 0, 'characters');
        console.log('  - FAQ Sections:', contentResults.faqSections ? 'Generated' : 'Not generated');

        // Test 5: Execute Market Intelligence Workflow
        console.log('\n🧠 Testing Market Intelligence...');
        const intelligenceInput = {
            searchQuery: 'vintage leather jacket market trends 2024',
            sources: ['google', 'bing'],
            relevanceCriteria: 'vintage fashion market analysis'
        };

        const intelligenceResults = await workflowEngine.executeWorkflow(
            'market-intelligence',
            intelligenceInput
        );

        console.log('✅ Market Intelligence Results:');
        console.log('  - Raw Results Count:', intelligenceResults.rawResults?.length || 0);
        console.log('  - Ranked Results:', intelligenceResults.rankedResults ? 'Generated' : 'Not generated');
        console.log('  - Insights:', intelligenceResults.insights || 'No insights generated');

        // Test 6: Check execution history
        console.log('\n📊 Execution History:');
        const history = workflowEngine.getExecutionHistory(5);
        history.forEach((execution, index) => {
            console.log(`  ${index + 1}. ${execution.workflowName} - ${execution.status} (${execution.duration}ms)`);
        });

        console.log('\n🎉 All workflow tests completed successfully!');

    } catch (error) {
        console.error('❌ Workflow test failed:', error);
        console.error('Error details:', error.message);
        process.exit(1);
    }
}

// Test individual workflow components
async function testWorkflowComponents() {
    console.log('\n🔧 Testing Individual Workflow Components...\n');

    try {
        const { workflowImplementations } = await import('./src/utils/workflowImplementations.js');

        // Test product analysis parsing
        console.log('🔍 Testing product analysis parsing...');
        const mockAnalysis = `
            Brand: Vintage Leather Co
            Product Type: Leather Jacket
            Category: Outerwear
            Features: Genuine leather, vintage style, brown color
            Condition: Excellent
            Keywords: vintage, leather, jacket, brown, 1980s, retro
        `;

        const productData = workflowImplementations.parseProductAnalysis(mockAnalysis);
        const keywords = workflowImplementations.extractSEOKeywords(mockAnalysis);
        
        console.log('✅ Parsed Product Data:', productData);
        console.log('✅ Extracted Keywords:', keywords);

        // Test price range calculation
        console.log('\n💰 Testing price calculations...');
        const mockCompetitorData = [
            {
                competitors: [
                    { price: 45 },
                    { price: 67 },
                    { price: 52 }
                ]
            },
            {
                competitors: [
                    { price: 38 },
                    { price: 71 }
                ]
            }
        ];

        const priceRange = workflowImplementations.calculatePriceRange(mockCompetitorData);
        console.log('✅ Price Range:', priceRange);

        console.log('\n✅ Component tests completed successfully!');

    } catch (error) {
        console.error('❌ Component test failed:', error);
    }
}

// Run tests
async function runAllTests() {
    console.log('🧪 Starting AI Workflow Engine Tests\n');
    console.log('=' .repeat(50));
    
    await testWorkflowEngine();
    await testWorkflowComponents();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 All tests completed!');
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().catch(console.error);
}

export { testWorkflowEngine, testWorkflowComponents, runAllTests };