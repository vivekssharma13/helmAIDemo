/**
 * SCALABLE EMBEDDING CREATOR - Production Ready Version
 * 
 * This creates embeddings for your knowledge base and saves them to vector database.
 * Unlike the educational version, this handles large datasets and real AI models.
 * 
 * How it works:
 * 1. Takes your articles/knowledge base
 * 2. Converts each article to a vector using local AI
 * 3. Saves all vectors to vector database for fast searching later
 * 
 * Why this approach?
 * - Create embeddings once, search many times (fast!)
 * - Works with local AI models (no API costs)
 * - Handles large datasets efficiently
 * - Uses vector database for scalable storage and search
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { HelmAIVectorDB } = require('./vector-database');

/**
 * Simple Embedding Creator for Knowledge Base
 * This handles the "heavy lifting" of converting articles to embeddings
 */
class EmbeddingCreator {
    constructor(options = {}) {
        this.ollamaUrl = options.ollamaUrl || 'http://localhost:11434';
        this.model = options.model || 'mistral:latest';
        this.storageFolder = options.storageFolder || './embeddings-storage';
        this.batchSize = options.batchSize || 10; // Process 10 articles at a time
        
        // Initialize vector database
        this.vectorDB = new HelmAIVectorDB({
            ollamaUrl: this.ollamaUrl,
            model: this.model,
            collectionName: options.collectionName || 'helmai-knowledge-base'
        });
        
        console.log(`🤖 EmbeddingCreator initialized:`);
        console.log(`   - AI Model: ${this.model}`);
        console.log(`   - Batch Size: ${this.batchSize}`);
        console.log(`   - Vector DB Collection: ${this.vectorDB.collectionName}`);
    }

    /**
     * STEP 1: Check if your AI model is running
     * Call this first to make sure everything is ready
     */
    async checkAIModelStatus() {
        try {
            console.log('🔍 Checking if your AI model is running...');
            
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
                timeout: 5000
            });
            
            const models = response.data.models.map(m => m.name);
            console.log('✅ AI models available:', models);
            
            if (!models.includes(this.model)) {
                throw new Error(`Model ${this.model} not found. Available: ${models.join(', ')}`);
            }
            
            console.log(`✅ Using model: ${this.model}`);
            return true;
            
        } catch (error) {
            console.error('❌ AI model not running!');
            console.log('💡 To fix this:');
            console.log('   1. Open terminal and run: ollama serve');
            console.log('   2. Wait 10 seconds');
            console.log('   3. Try again');
            throw error;
        }
    }

    /**
     * STEP 2: Convert a single article to embedding (numbers)
     * This is like creating one "index card" for one book
     */
    async convertArticleToEmbedding(articleText) {
        try {
            console.log(`🧠 Converting to numbers: "${articleText.substring(0, 50)}..."`);
            
            const response = await axios.post(
                `${this.ollamaUrl}/api/embeddings`,
                {
                    model: this.model,
                    prompt: articleText
                },
                {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            const embedding = response.data.embedding;
            console.log(`✅ Converted! Got ${embedding.length} numbers`);
            
            return embedding;
            
        } catch (error) {
            console.error(`❌ Failed to convert article: ${error.message}`);
            throw error;
        }
    }

    /**
     * STEP 3: Process many articles in batches (so we don't overwhelm the AI)
     * This is like creating index cards for multiple books, but doing it in small groups
     */
    async createEmbeddingsForKnowledgeBase(knowledgeBase) {
        console.log(`🚀 Starting to process ${knowledgeBase.length} articles...`);
        console.log(`📦 Processing in batches of ${this.batchSize} articles`);
        
        const results = [];
        const totalBatches = Math.ceil(knowledgeBase.length / this.batchSize);
        
        // Process articles in small groups
        for (let i = 0; i < knowledgeBase.length; i += this.batchSize) {
            const currentBatch = Math.floor(i / this.batchSize) + 1;
            console.log(`\n📦 Processing batch ${currentBatch}/${totalBatches}...`);
            
            // Get this batch of articles
            const batch = knowledgeBase.slice(i, i + this.batchSize);
            
            // Convert each article in this batch
            for (const article of batch) {
                try {
                    const embedding = await this.convertArticleToEmbedding(article.text);
                    
                    results.push({
                        id: article.id,
                        text: article.text,
                        intent: article.intent,
                        embedding: embedding,
                        metadata: article.metadata || {},
                        createdAt: new Date().toISOString()
                    });
                    
                } catch (error) {
                    console.error(`⚠️  Skipping article ${article.id}: ${error.message}`);
                }
            }
            
            // Small delay between batches to be nice to the AI
            if (currentBatch < totalBatches) {
                console.log('⏳ Pausing 2 seconds before next batch...');
                await this.sleep(2000);
            }
        }
        
        console.log(`\n✅ Finished! Processed ${results.length}/${knowledgeBase.length} articles`);
        return results;
    }

    /**
     * STEP 4: Save embeddings to vector database
     * This replaces the JSON file storage with scalable vector database storage
     */
    async saveEmbeddingsToVectorDB(knowledgeBase) {
        try {
            console.log('🗄️ === SAVING TO VECTOR DATABASE ===');
            console.log(`💾 Storing ${knowledgeBase.length} articles in vector database...`);
            
            // Initialize vector database if not already done
            await this.vectorDB.initialize();
            
            // Add all articles with their embeddings to the vector database
            const savedCount = await this.vectorDB.addArticlesToDB(knowledgeBase);
            
            console.log('✅ Articles saved to vector database successfully!');
            console.log(`📊 Database Statistics:`);
            console.log(`   - Articles stored: ${savedCount}`);
            console.log(`   - Model used: ${this.model}`);
            console.log(`   - Collection: ${this.vectorDB.collectionName}`);
            
            return {
                success: true,
                savedCount: savedCount,
                collection: this.vectorDB.collectionName
            };
            
        } catch (error) {
            console.error('❌ Failed to save to vector database:', error.message);
            throw error;
        }
    }

    /**
     * STEP 4 (Legacy): Save embeddings to JSON file
     * This method is kept for backwards compatibility but vector database is preferred
     */
    async saveEmbeddingsToFile(embeddings, filename = null) {
        try {
            console.log('🗄️ === SAVING TO FILE (Legacy Mode) ===');
            console.log('⚠️  Consider using vector database for better performance!');
            
            // Ensure storage directory exists
            await fs.mkdir(this.storageFolder, { recursive: true });
            
            // Create filename if not provided
            if (!filename) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                filename = `embeddings-${timestamp}.json`;
            }
            
            // Ensure .json extension
            if (!filename.endsWith('.json')) {
                filename += '.json';
            }
            
            const filePath = path.join(this.storageFolder, filename);
            
            console.log(`💾 Saving ${embeddings.length} embeddings to ${filePath}...`);
            
            // Save with some metadata
            const dataToSave = {
                model: this.model,
                totalEmbeddings: embeddings.length,
                createdAt: new Date().toISOString(),
                embeddings: embeddings
            };
            
            await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
            
            console.log('✅ Embeddings saved successfully!');
            console.log(`📁 File location: ${filePath}`);

            return filePath;
            
        } catch (error) {
            console.error('❌ Failed to save embeddings:', error.message);
            throw error;
        }
    }    /**
     * STEP 5: Complete workflow - from articles to vector database
     * This is the main function you'll call to set up your knowledge base
     */
    async createAndSaveEmbeddings(knowledgeBase, useVectorDB = true, filename = null) {
        console.log('🎯 === EMBEDDING CREATION WORKFLOW ===\n');
        
        try {
            // Step 1: Make sure AI is ready
            await this.checkAIModelStatus();
            
            // Step 2: Convert all articles to embeddings
            const embeddings = await this.createEmbeddingsForKnowledgeBase(knowledgeBase);
            
            // Step 3: Save to vector database (preferred) or file (legacy)
            let saveResult;
            if (useVectorDB) {
                // Add embeddings back to knowledge base for vector DB storage
                const enrichedKnowledgeBase = knowledgeBase.map((article, index) => ({
                    ...article,
                    embedding: embeddings[index].embedding
                }));
                
                saveResult = await this.saveEmbeddingsToVectorDB(enrichedKnowledgeBase);
                
                console.log('\n🎉 SUCCESS! Your knowledge base is ready for fast vector searching!');
                console.log(`📊 Stats:`);
                console.log(`   - Articles processed: ${embeddings.length}`);
                console.log(`   - Model used: ${this.model}`);
                console.log(`   - Saved to: Vector Database (${saveResult.collection})`);
                
                return {
                    success: true,
                    embeddingsCount: embeddings.length,
                    storage: 'vector-database',
                    collection: saveResult.collection,
                    model: this.model
                };
                
            } else {
                // Legacy file storage
                const savedFile = await this.saveEmbeddingsToFile(embeddings, filename);
                
                console.log('\n🎉 SUCCESS! Your knowledge base is ready for searching!');
                console.log(`📊 Stats:`);
                console.log(`   - Articles processed: ${embeddings.length}`);
                console.log(`   - Model used: ${this.model}`);
                console.log(`   - File saved: ${savedFile}`);
                
                return {
                    success: true,
                    embeddingsCount: embeddings.length,
                    storage: 'file',
                    filePath: savedFile,
                    model: this.model
                };
            }
            
        } catch (error) {
            console.error('\n❌ FAILED to create embeddings:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper function to pause execution
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * EXAMPLE: How to use this file
 * Copy this code and modify it for your needs
 */
async function exampleUsage() {
    console.log('📚 === EXAMPLE: Creating Embeddings for HelmAI ===\n');
    
    // Step 1: Create your knowledge base (your articles with intents)
    const airlineKnowledgeBase = [
        {
            id: 'kb001',
            text: 'How to book a flight online using our website or mobile app',
            intent: 'flight_booking',
            metadata: { category: 'booking', priority: 'high' }
        },
        {
            id: 'kb002', 
            text: 'Flight cancellation policy and how to get refunds',
            intent: 'flight_cancellation',
            metadata: { category: 'cancellation', priority: 'high' }
        },
        {
            id: 'kb003',
            text: 'Lost baggage tracking and how to report missing luggage',
            intent: 'baggage_issue',
            metadata: { category: 'baggage', priority: 'medium' }
        },
        {
            id: 'kb004',
            text: 'Check flight status and delay information in real-time',
            intent: 'flight_status',
            metadata: { category: 'status', priority: 'medium' }
        },
        {
            id: 'kb005',
            text: 'Emergency crew support and priority assistance procedures',
            intent: 'crew_emergency',
            metadata: { category: 'emergency', priority: 'critical' }
        }
    ];
    
    // Step 2: Create the embedding creator
    const creator = new EmbeddingCreator({
        model: 'mistral:latest',  // or 'llama3.2:latest'
        batchSize: 3,             // Process 3 articles at a time
        collectionName: 'helmai-demo'  // Custom collection name
    });
    
    // Step 3: Create and save embeddings to vector database (recommended)
    console.log('🚀 Using Vector Database (Recommended):');
    const vectorResult = await creator.createAndSaveEmbeddings(
        airlineKnowledgeBase, 
        true  // Use vector database
    );
    
    if (vectorResult.success) {
        console.log('\n🎯 Next step: Use vector database for fast searching!');
        console.log('💡 Your embeddings are now stored in Chroma DB for lightning-fast retrieval');
        
        // Optional: Also demonstrate file storage (legacy mode)
        console.log('\n📁 Legacy File Storage (for comparison):');
        const fileResult = await creator.createAndSaveEmbeddings(
            airlineKnowledgeBase,
            false,  // Don't use vector database
            'helmai-demo-legacy.json'  // Save to file instead
        );
        
        if (fileResult.success) {
            console.log('📊 Performance comparison:');
            console.log('   - Vector DB: Fast search, scalable, production-ready');
            console.log('   - File storage: Simple, good for development/testing');
        }
    }
}

// Export the class so other files can use it
module.exports = {
    EmbeddingCreator
};

// Run example if this file is called directly
if (require.main === module) {
    exampleUsage();
}
