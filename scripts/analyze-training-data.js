#!/usr/bin/env node

/**
 * CSV TRAINING DATA ANALYZER
 * 
 * Analyzes the airline training data CSV to provide insights
 * about the data distribution, intents, categories, etc.
 */

const fs = require('fs').promises;
const path = require('path');

async function analyzeCSVData() {
    console.log('📊 HelmAI Training Data Analyzer');
    console.log('=================================\n');
    
    try {
        const csvPath = path.resolve('./data/airline-training-data.csv');
        const content = await fs.readFile(csvPath, 'utf-8');
        const lines = content.trim().split('\n');
        
        // Skip header
        const dataLines = lines.slice(1);
        console.log(`📋 Total Records: ${dataLines.length}\n`);
        
        // Parse data
        const data = dataLines.map(line => {
            const values = line.split(',');
            return {
                id: values[0],
                text: values[1]?.replace(/^"|"$/g, ''),
                intent: values[2],
                category: values[3],
                priority: values[4]
            };
        });
        
        // Analyze intents
        const intentCounts = {};
        const categoryCounts = {};
        const priorityCounts = {};
        const textLengths = [];
        
        data.forEach(item => {
            // Count intents
            intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
            
            // Count categories
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            
            // Count priorities
            priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
            
            // Track text lengths
            if (item.text) {
                textLengths.push(item.text.length);
            }
        });
        
        // Display Intent Analysis
        console.log('🎯 Intent Distribution:');
        Object.entries(intentCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([intent, count]) => {
                const percentage = Math.round((count / data.length) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`   ${intent.padEnd(20)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(2)}%) ${bar}`);
            });
        
        console.log('\n📂 Category Distribution:');
        Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                const percentage = Math.round((count / data.length) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`   ${category.padEnd(15)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(2)}%) ${bar}`);
            });
        
        console.log('\n⚡ Priority Distribution:');
        Object.entries(priorityCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([priority, count]) => {
                const percentage = Math.round((count / data.length) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`   ${priority.padEnd(10)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(2)}%) ${bar}`);
            });
        
        // Text Length Analysis
        const avgLength = Math.round(textLengths.reduce((a, b) => a + b, 0) / textLengths.length);
        const minLength = Math.min(...textLengths);
        const maxLength = Math.max(...textLengths);
        
        console.log('\n📝 Text Length Analysis:');
        console.log(`   Average Length: ${avgLength} characters`);
        console.log(`   Shortest Text:  ${minLength} characters`);
        console.log(`   Longest Text:   ${maxLength} characters`);
        
        // Show sample texts for each intent
        console.log('\n📋 Sample Texts by Intent:');
        Object.keys(intentCounts).forEach(intent => {
            const samples = data.filter(item => item.intent === intent).slice(0, 2);
            console.log(`\n   ${intent}:`);
            samples.forEach(sample => {
                const text = sample.text?.length > 60 ? sample.text.substring(0, 60) + '...' : sample.text;
                console.log(`     • "${text}"`);
            });
        });
        
        // Data Quality Check
        console.log('\n🔍 Data Quality Check:');
        const emptyTexts = data.filter(item => !item.text || item.text.trim() === '').length;
        const emptyIntents = data.filter(item => !item.intent || item.intent.trim() === '').length;
        const duplicateTexts = data.length - new Set(data.map(item => item.text)).size;
        
        console.log(`   Empty Texts:      ${emptyTexts}`);
        console.log(`   Empty Intents:    ${emptyIntents}`);
        console.log(`   Duplicate Texts:  ${duplicateTexts}`);
        console.log(`   Data Quality:     ${emptyTexts + emptyIntents + duplicateTexts === 0 ? '✅ Excellent' : '⚠️  Needs Review'}`);
        
        // Training Recommendations
        console.log('\n💡 Training Recommendations:');
        console.log(`   • Total training samples: ${data.length} (${data.length >= 400 ? '✅ Good' : '⚠️  Consider adding more'})`);
        console.log(`   • Intent balance: ${Math.max(...Object.values(intentCounts)) / Math.min(...Object.values(intentCounts)) < 3 ? '✅ Well balanced' : '⚠️  Some intents need more samples'}`);
        console.log(`   • Text diversity: ${textLengths.length > 0 ? '✅ Good variety' : '❌ No text data'}`);
        console.log(`   • Ready for import: ${emptyTexts + emptyIntents === 0 ? '✅ Yes' : '❌ Fix data quality issues first'}`);
        
        console.log('\n🚀 Next Steps:');
        console.log('   1. Run: node scripts/quick-import.js');
        console.log('   2. Or: node scripts/import-csv-knowledge-base.js');
        console.log('   3. Test: curl -X POST http://localhost:3001/api/search -H "Content-Type: application/json" -d \'{"query": "book flight"}\'');
        
    } catch (error) {
        console.error('❌ Error analyzing CSV data:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    analyzeCSVData();
}
