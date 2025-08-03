#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function analyzeCSVData() {
    console.log('📊 Training Data Analyzer\n');
    
    try {
        const intentsPath = path.resolve('./data/intents');
        
        try {
            await fs.access(intentsPath);
        } catch (error) {
            throw new Error(`Intents folder not found: ${intentsPath}`);
        }
        
        const intentFolders = await fs.readdir(intentsPath);
        const allData = [];
        let totalFiles = 0;
        
        for (const folder of intentFolders) {
            const folderPath = path.join(intentsPath, folder);
            const folderStat = await fs.stat(folderPath);
            
            if (!folderStat.isDirectory()) continue;
            
            const files = await fs.readdir(folderPath);
            const csvFiles = files.filter(file => file.endsWith('.csv'));
            
            for (const csvFile of csvFiles) {
                const csvPath = path.join(folderPath, csvFile);
                const content = await fs.readFile(csvPath, 'utf-8');
                const lines = content.trim().split('\n');
                
                const dataLines = lines.slice(1);
                
                dataLines.forEach(line => {
                    if (!line.trim()) return;
                    
                    const values = [];
                    let current = '';
                    let inQuotes = false;
                    
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            values.push(current);
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current);
                    
                    if (values.length >= 5) {
                        allData.push({
                            id: values[0],
                            text: values[1]?.replace(/^"|"$/g, ''),
                            intent: values[2],
                            category: values[3],
                            priority: values[4]
                        });
                    }
                });
                
                totalFiles++;
            }
        }
        
        console.log(`✅ Processed ${totalFiles} files, ${allData.length} records\n`);
        
        // Analyze intents
        const intentCounts = {};
        const categoryCounts = {};
        const priorityCounts = {};
        const textLengths = [];
        
        allData.forEach(item => {
            intentCounts[item.intent] = (intentCounts[item.intent] || 0) + 1;
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
            
            if (item.text) {
                textLengths.push(item.text.length);
            }
        });
        
        console.log('🎯 Intent Distribution:');
        Object.entries(intentCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([intent, count]) => {
                const percentage = Math.round((count / allData.length) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`   ${intent.padEnd(20)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(2)}%) ${bar}`);
            });
        
        console.log('\n📂 Category Distribution:');
        Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                const percentage = Math.round((count / allData.length) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`   ${category.padEnd(15)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(2)}%) ${bar}`);
            });
        
        console.log('\n⚡ Priority Distribution:');
        Object.entries(priorityCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([priority, count]) => {
                const percentage = Math.round((count / allData.length) * 100);
                const bar = '█'.repeat(Math.floor(percentage / 2));
                console.log(`   ${priority.padEnd(10)} │ ${count.toString().padStart(3)} (${percentage.toString().padStart(2)}%) ${bar}`);
            });
        
        const avgLength = Math.round(textLengths.reduce((a, b) => a + b, 0) / textLengths.length);
        const minLength = Math.min(...textLengths);
        const maxLength = Math.max(...textLengths);
        
        console.log('\n📝 Text Length Analysis:');
        console.log(`   Average Length: ${avgLength} characters`);
        console.log(`   Shortest Text:  ${minLength} characters`);
        console.log(`   Longest Text:   ${maxLength} characters`);
        
        console.log('\n📋 Sample Texts by Intent:');
        Object.keys(intentCounts).forEach(intent => {
            const samples = allData.filter(item => item.intent === intent).slice(0, 2);
            console.log(`\n   ${intent}:`);
            samples.forEach(sample => {
                const text = sample.text?.length > 60 ? sample.text.substring(0, 60) + '...' : sample.text;
                console.log(`     • "${text}"`);
            });
        });
        
        console.log('\n🔍 Data Quality Check:');
        const emptyTexts = allData.filter(item => !item.text || item.text.trim() === '').length;
        const emptyIntents = allData.filter(item => !item.intent || item.intent.trim() === '').length;
        const duplicateTexts = allData.length - new Set(allData.map(item => item.text)).size;
        
        console.log(`   Empty Texts:      ${emptyTexts}`);
        console.log(`   Empty Intents:    ${emptyIntents}`);
        console.log(`   Duplicate Texts:  ${duplicateTexts}`);
        console.log(`   Data Quality:     ${emptyTexts + emptyIntents + duplicateTexts === 0 ? '✅ Excellent' : '⚠️  Needs Review'}`);
        
        console.log('\n💡 Recommendations:');
        console.log(`   • Total training samples: ${allData.length} (${allData.length >= 400 ? '✅ Good' : '⚠️  Consider adding more'})`);
        console.log(`   • Intent balance: ${Math.max(...Object.values(intentCounts)) / Math.min(...Object.values(intentCounts)) < 3 ? '✅ Well balanced' : '⚠️  Some intents need more samples'}`);
        console.log(`   • Text diversity: ${textLengths.length > 0 ? '✅ Good variety' : '❌ No text data'}`);
        console.log(`   • Ready for import: ${emptyTexts + emptyIntents === 0 ? '✅ Yes' : '❌ Fix data quality issues first'}`);
        
    } catch (error) {
        console.error('❌ Error analyzing intents data:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    analyzeCSVData();
}
