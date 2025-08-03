#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { HelmAIEmbeddingSystem } = require('../helmai-system.js');

const CONFIG = {
    intentsPath: './data/intents',
    batchSize: 10,
    model: 'mistral:latest',
    collection: 'helmai-production',
    delimiter: ',',
    skipHeader: true,
    validateData: true,
    logProgress: true,
    createBackup: true
};

class DataValidator {
    static validateEntry(entry) {
        const required = ['id', 'text', 'intent', 'category', 'priority'];
        const missing = required.filter(field => !entry[field] || entry[field].trim() === '');
        
        if (missing.length > 0) {
            return { valid: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
        }
        
        if (entry.text.length < 10) {
            return { valid: false, errors: ['Text must be at least 10 characters long'] };
        }
        
        if (entry.text.length > 1000) {
            return { valid: false, errors: ['Text must be less than 1000 characters long'] };
        }
        
        return { valid: true, errors: [] };
    }
}

/**
 * CSV Parser
 */
class CSVParser {
    static async parseIntentsFolder(intentsPath) {
        try {
            console.log(`📂 Reading intents from: ${intentsPath}`);
            
            const intentFolders = await fs.readdir(intentsPath);
            const allData = [];
            let totalFiles = 0;
            
            for (const folder of intentFolders) {
                const folderPath = path.join(intentsPath, folder);
                const folderStat = await fs.stat(folderPath);
                
                if (!folderStat.isDirectory()) continue;
                
                console.log(`📋 Processing intent folder: ${folder}`);
                
                const files = await fs.readdir(folderPath);
                const csvFiles = files.filter(file => file.endsWith('.csv'));
                
                for (const csvFile of csvFiles) {
                    const csvPath = path.join(folderPath, csvFile);
                    console.log(`   📄 Reading: ${csvFile}`);
                    
                    const csvData = await this.parseCSV(csvPath);
                    allData.push(...csvData);
                    totalFiles++;
                }
            }
            
            console.log(`✅ Processed ${totalFiles} CSV files from ${intentFolders.length} intent folders`);
            console.log(`📊 Total records loaded: ${allData.length}`);
            
            return allData;
        } catch (error) {
            throw new Error(`Failed to parse intents folder: ${error.message}`);
        }
    }
    
    static async parseCSV(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.trim().split('\n');
            
            if (lines.length === 0) {
                throw new Error('CSV file is empty');
            }
            
            const headers = CONFIG.skipHeader ? lines[0].split(CONFIG.delimiter) : ['id', 'text', 'intent', 'category', 'priority'];
            const dataLines = CONFIG.skipHeader ? lines.slice(1) : lines;
            
            console.log(`📊 Found ${dataLines.length} data rows in CSV`);
            
            const parsedData = [];
            let skippedCount = 0;
            
            for (let i = 0; i < dataLines.length; i++) {
                const line = dataLines[i].trim();
                if (!line) continue;
                
                const values = this.parseCSVLine(line);
                
                if (values.length < headers.length) {
                    console.warn(`⚠️  Row ${i + 1}: Insufficient columns, skipping`);
                    skippedCount++;
                    continue;
                }
                
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header.trim()] = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
                });
                
                if (CONFIG.validateData) {
                    const validation = DataValidator.validateEntry(entry);
                    if (!validation.valid) {
                        console.warn(`⚠️  Row ${i + 1}: ${validation.errors.join(', ')}, skipping`);
                        skippedCount++;
                        continue;
                    }
                }
                
                parsedData.push(entry);
            }
            
            console.log(`✅ Successfully parsed ${parsedData.length} valid entries`);
            if (skippedCount > 0) {
                console.log(`⚠️  Skipped ${skippedCount} invalid entries`);
            }
            
            return parsedData;
        } catch (error) {
            throw new Error(`Failed to parse CSV: ${error.message}`);
        }
    }
    
    static parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === CONFIG.delimiter && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }
}

/**
 * Knowledge Base Importer
 */
class KnowledgeBaseImporter {
    constructor() {
        this.helmAI = new HelmAIEmbeddingSystem({
            model: CONFIG.model,
            collectionName: CONFIG.collection,
            batchSize: CONFIG.batchSize
        });
        this.processedCount = 0;
        this.errors = [];
    }
    
    async initialize() {
        console.log('🚀 Initializing HelmAI Embedding System...');
        try {
            await this.helmAI.initialize();
            console.log('✅ HelmAI system initialized successfully');
        } catch (error) {
            throw new Error(`Failed to initialize HelmAI system: ${error.message}`);
        }
    }
    
    async importData(csvData) {
        console.log(`📚 Starting import of ${csvData.length} articles...`);
        
        const knowledgeBase = csvData.map(entry => ({
            id: entry.id,
            text: entry.text,
            intent: entry.intent,
            metadata: {
                category: entry.category,
                priority: entry.priority,
                source: 'csv_import',
                importedAt: new Date().toISOString()
            }
        }));
        
        try {
            const batches = this.createBatches(knowledgeBase, CONFIG.batchSize);
            console.log(`📦 Processing ${batches.length} batches of ${CONFIG.batchSize} articles each`);
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} articles)...`);
                
                try {
                    await this.processBatch(batch, i + 1);
                    this.processedCount += batch.length;
                    
                    if (CONFIG.logProgress) {
                        const percentage = Math.round((this.processedCount / csvData.length) * 100);
                        console.log(`✅ Batch ${i + 1} completed. Progress: ${this.processedCount}/${csvData.length} (${percentage}%)`);
                    }
                    
                    if (i < batches.length - 1) {
                        await this.delay(1000);
                    }
                } catch (error) {
                    console.error(`❌ Error processing batch ${i + 1}: ${error.message}`);
                    this.errors.push(`Batch ${i + 1}: ${error.message}`);
                }
            }
            
            console.log(`\n🎉 Import completed!`);
            console.log(`✅ Successfully processed: ${this.processedCount} articles`);
            console.log(`❌ Errors encountered: ${this.errors.length}`);
            
            if (this.errors.length > 0) {
                console.log('\n📋 Error Summary:');
                this.errors.forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
            }
            
            return {
                processed: this.processedCount,
                total: csvData.length,
                errors: this.errors.length,
                success: this.errors.length === 0
            };
            
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }
    
    async processBatch(batch, batchNumber) {
        try {
            const result = await this.helmAI.createKnowledgeBase(batch);
            
            if (!result.success) {
                throw new Error(`Batch processing failed: ${result.error || 'Unknown error'}`);
            }
            
            console.log(`   ✅ Batch ${batchNumber}: Created ${result.embeddingsCount} embeddings and stored in database`);
            return result;
            
        } catch (error) {
            throw new Error(`Batch processing failed: ${error.message}`);
        }
    }
    
    createBatches(array, size) {
        const batches = [];
        for (let i = 0; i < array.length; i += size) {
            batches.push(array.slice(i, i + size));
        }
        return batches;
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async getStats() {
        try {
            return await this.helmAI.getStats();
        } catch (error) {
            console.warn('Could not retrieve stats:', error.message);
            return null;
        }
    }
}

/**
 * Backup Manager
 */
class BackupManager {
    static async createBackup() {
        if (!CONFIG.createBackup) return null;
        
        console.log('💾 Creating backup of existing knowledge base...');
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `./data/backup-knowledge-base-${timestamp}.json`;
            
            console.log(`💾 Backup would be created at: ${backupPath}`);
            console.log('ℹ️  Backup functionality can be implemented based on your existing export methods');
            
            return backupPath;
        } catch (error) {
            console.warn('⚠️  Could not create backup:', error.message);
            return null;
        }
    }
}

/**
 * Main Import Function
 */
async function importCSVToKnowledgeBase() {
    console.log('🎯 === HELMAI CSV KNOWLEDGE BASE IMPORTER ===\n');
    
    try {
        const intentsPath = path.resolve(CONFIG.intentsPath);
        try {
            await fs.access(intentsPath);
        } catch (error) {
            throw new Error(`Intents folder not found: ${intentsPath}`);
        }
        
        console.log(`📂 Reading intents folder: ${intentsPath}`);
        console.log(`🤖 Using model: ${CONFIG.model}`);
        console.log(`🗄️  Target collection: ${CONFIG.collection}`);
        console.log(`📦 Batch size: ${CONFIG.batchSize}\n`);
        
        await BackupManager.createBackup();
        
        const csvData = await CSVParser.parseIntentsFolder(intentsPath);
        
        if (csvData.length === 0) {
            throw new Error('No valid data found in intents folder');
        }
        
        const importer = new KnowledgeBaseImporter();
        await importer.initialize();
        
        const result = await importer.importData(csvData);
        
        console.log('\n📊 Final System Stats:');
        const stats = await importer.getStats();
        if (stats) {
            console.log(`   Articles in database: ${stats.knowledgeBase?.articleCount || 'unknown'}`);
            console.log(`   Collection: ${stats.collection}`);
            console.log(`   Model: ${stats.model}`);
        }
        
        console.log('\n🎉 === IMPORT COMPLETE ===');
        console.log(`✅ Successfully imported ${result.processed}/${result.total} articles`);
        console.log(`❌ Errors: ${result.errors}`);
        console.log(`✨ Your knowledge base is ready for semantic search!`);
        
        process.exit(result.success ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ === IMPORT FAILED ===');
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * CLI Interface
 */
if (require.main === module) {
    const args = process.argv.slice(2);
    
    args.forEach(arg => {
        if (arg.startsWith('--intents=')) {
            CONFIG.intentsPath = arg.split('=')[1];
        } else if (arg.startsWith('--batch-size=')) {
            CONFIG.batchSize = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--model=')) {
            CONFIG.model = arg.split('=')[1];
        } else if (arg === '--no-backup') {
            CONFIG.createBackup = false;
        } else if (arg === '--no-validation') {
            CONFIG.validateData = false;
        } else if (arg === '--quiet') {
            CONFIG.logProgress = false;
        }
    });
    
    importCSVToKnowledgeBase();
}

module.exports = {
    KnowledgeBaseImporter,
    CSVParser,
    DataValidator,
    CONFIG
};
