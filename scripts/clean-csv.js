#!/usr/bin/env node

/**
 * CSV CLEANER SCRIPT
 * Fixes the CSV data formatting issues
 */

const fs = require('fs').promises;

async function cleanCSV() {
    try {
        const content = await fs.readFile('./data/airline-training-data.csv', 'utf-8');
        const lines = content.split('\n');
        
        console.log('🧹 Cleaning CSV data...');
        
        const cleanedLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse line manually to handle quotes correctly
            const parts = [];
            let current = '';
            let inQuotes = false;
            let j = 0;
            
            while (j < line.length) {
                const char = line[j];
                
                if (char === '"' && (j === 0 || line[j-1] === ',')) {
                    inQuotes = true;
                    j++;
                    continue;
                }
                
                if (char === '"' && inQuotes && (j === line.length - 1 || line[j+1] === ',')) {
                    inQuotes = false;
                    j++;
                    continue;
                }
                
                if (char === ',' && !inQuotes) {
                    parts.push(current);
                    current = '';
                } else {
                    current += char;
                }
                
                j++;
            }
            parts.push(current);
            
            // Validate we have 5 parts
            if (parts.length >= 5) {
                const cleanLine = parts.slice(0, 5).map(part => {
                    // Clean up the part
                    part = part.trim();
                    if (part.includes('"') && !part.startsWith('"')) {
                        part = `"${part}"`;
                    }
                    return part;
                }).join(',');
                
                cleanedLines.push(cleanLine);
            } else if (i > 0) { // Skip header validation
                console.log(`⚠️  Skipping malformed line ${i + 1}: ${line}`);
            } else {
                cleanedLines.push(line); // Keep header as is
            }
        }
        
        const cleanedContent = cleanedLines.join('\n');
        await fs.writeFile('./data/airline-training-data-clean.csv', cleanedContent);
        
        console.log(`✅ Cleaned CSV saved as airline-training-data-clean.csv`);
        console.log(`📊 Lines processed: ${lines.length}`);
        console.log(`📊 Lines kept: ${cleanedLines.length}`);
        
    } catch (error) {
        console.error('❌ Error cleaning CSV:', error.message);
    }
}

cleanCSV();
