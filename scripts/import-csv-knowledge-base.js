#!/usr/bin/env node

/**
 * HELMAI KNOWLEDGE BASE CSV IMPORTER
 * 
 * This script reads airline training data from CSV file and imports it 
 * into the HelmAI vector database using the current Mistral model.
 * 
 * Features:
 * - Reads CSV data with intent classification
 * - Batch processing for efficient embedding creation
 * - Progress tracking and error handling
 * - Configurable batch sizes and processing options
 * - Validates data before processing
 * - Creates embeddings using local Mistral model
 */

const fs = require('fs').promises;
const path = require('path');
const { HelmAIEmbeddingSystem } = require('../helmai-system.js');

/**
 * Configuration for the import process
 */
const CONFIG = {
    csvPath: './data/airline-training-data.csv',
    batchSize: 10,                    // Process 10 articles at a time
    model: 'mistral:latest',          // Use your local Mistral model
    collection: 'helmai-production',  // Target collection name
    delimiter: ',',                   // CSV delimiter
    skipHeader: true,                 // Skip the first row (header)
    validateData: true,               // Validate each entry before processing
    logProgress: true,                // Show progress during import
    createBackup: true                // Create backup before import
};

/**
 * CSV Data Validator
 */
class DataValidator {
    static validateEntry(entry) {
        const required = ['id', 'text', 'intent', 'category', 'priority'];
        const missing = required.filter(field => !entry[field] || entry[field].trim() === '');
        
        if (missing.length > 0) {
            return { valid: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
        }
        
        // Validate text length
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
                
                // Validate if enabled
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
        
        // Convert CSV data to knowledge base format
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
            // Process in batches
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
                    
                    // Small delay between batches to prevent overwhelming the system
                    if (i < batches.length - 1) {
                        await this.delay(1000);
                    }
                } catch (error) {
                    console.error(`❌ Error processing batch ${i + 1}: ${error.message}`);
                    this.errors.push(`Batch ${i + 1}: ${error.message}`);
                    // Continue with next batch
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
            // Use the HelmAI system to process the batch directly
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
            
            // This would need to be implemented based on your current knowledge base export functionality
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
        // Validate CSV file exists
        const csvPath = path.resolve(CONFIG.csvPath);
        try {
            await fs.access(csvPath);
        } catch (error) {
            throw new Error(`CSV file not found: ${csvPath}`);
        }
        
        console.log(`📂 Reading CSV file: ${csvPath}`);
        console.log(`🤖 Using model: ${CONFIG.model}`);
        console.log(`🗄️  Target collection: ${CONFIG.collection}`);
        console.log(`📦 Batch size: ${CONFIG.batchSize}\n`);
        
        // Create backup if enabled
        await BackupManager.createBackup();
        
        // Parse CSV data
        const csvData = await CSVParser.parseCSV(csvPath);
        
        if (csvData.length === 0) {
            throw new Error('No valid data found in CSV file');
        }
        
        // Initialize importer
        const importer = new KnowledgeBaseImporter();
        await importer.initialize();
        
        // Import data
        const result = await importer.importData(csvData);
        
        // Show final stats
        console.log('\n📊 Final System Stats:');
        const stats = await importer.getStats();
        if (stats) {
            console.log(`   Articles in database: ${stats.knowledgeBase?.articleCount || 'unknown'}`);
            console.log(`   Collection: ${stats.collection}`);
            console.log(`   Model: ${stats.model}`);
        }
        
        // Summary
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
    // Handle command line arguments
    const args = process.argv.slice(2);
    
    // Update config based on arguments
    args.forEach(arg => {
        if (arg.startsWith('--csv=')) {
            CONFIG.csvPath = arg.split('=')[1];
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
