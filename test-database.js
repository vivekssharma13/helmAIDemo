#!/usr/bin/env node

/**
 * Quick test to verify the ChromaDB has our imported data
 */

const { HelmAIEmbeddingSystem } = require('./helmai-system.js');

async function testDatabase() {
    console.log('🔍 Testing database contents...');
    
    const helmAI = new HelmAIEmbeddingSystem({
        model: 'mistral:latest',
        collectionName: 'helmai-production'
    });
    
    try {
        await helmAI.initialize();
        console.log('✅ Connected to HelmAI system');
        
        // Test a few search queries
        const queries = [
            "book a flight",
            "cancel my reservation", 
            "check flight status",
            "baggage rules"
        ];
        
        for (const query of queries) {
            console.log(`\n🔍 Testing: "${query}"`);
            const results = await helmAI.searchForAnswer(query, 2);
            console.log(`   Found ${results.length} results:`);
            results.forEach((result, index) => {
                console.log(`   ${index + 1}. [${result.intent}] ${result.text.substring(0, 60)}... (confidence: ${result.confidence}%)`);
            });
        }
        
        console.log('\n🎉 Database test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDatabase();
