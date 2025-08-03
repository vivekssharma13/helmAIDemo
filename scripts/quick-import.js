#!/usr/bin/env node

/**
 * QUICK CSV IMPORTER
 * 
 * Simple script to import CSV training data into HelmAI knowledge base
 * Usage: node scripts/quick-import.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 HelmAI Knowledge Base Importer\n');

// Configuration
const scriptPath = path.join(__dirname, 'import-csv-knowledge-base.js');
const intentsPath = './data/intents';

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Start import? (y/N): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('Starting import...\n');
        
        // Run the import script
        const importProcess = spawn('node', [scriptPath], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        importProcess.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Import completed successfully!');
            } else {
                console.log(`\n❌ Import failed with exit code ${code}`);
            }
        });
        
        importProcess.on('error', (error) => {
            console.error('❌ Import failed:', error.message);
        });
        
    } else {
        console.log('Import cancelled.');
        process.exit(0);
    }
});
