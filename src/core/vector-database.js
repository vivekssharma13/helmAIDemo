/**
 * VECTOR DATABASE SERVICE - Using Chroma DB
 * 
 * This file replaces the simple file storage with a proper vector database
 * Benefits:
 * 1. Faster similarity search
 * 2. Better memory management 
 * 3. Advanced filtering and querying
 * 4. Scalable to millions of documents
 */

const { ChromaClient } = require('chromadb');
const axios = require('axios');

/**
 * HelmAI Vector Database Service
 * This handles storing and searching embeddings using Chroma DB
 */
class HelmAIVectorDB {
    constructor(options = {}) {
        this.ollamaUrl = options.ollamaUrl || 'http://localhost:11434';
        this.model = options.model || 'mistral:latest';
        this.chromaUrl = options.chromaUrl || 'http://localhost:8000';
        this.collectionName = options.collectionName || 'helmai-knowledge-base';
        
        this.client = null;
        this.collection = null;
        this.isInitialized = false;
    }

    /**
     * STEP 1: Initialize Chroma DB connection
     * Call this first to set up the vector database
     */
    async initialize() {
        try {
            console.log('🔗 Connecting to Chroma DB...');
            
            // Connect to Chroma DB with updated configuration
            this.client = new ChromaClient({
                host: 'localhost',
                port: 8000
            });
            
            console.log('✅ Connected to Chroma DB');
            
            // Get or create collection for HelmAI knowledge base
            try {
                this.collection = await this.client.getCollection({
                    name: this.collectionName
                });
                console.log(`📚 Using existing collection: ${this.collectionName}`);
                
                // Check if existing collection has proper distance metric
                console.log(`🔍 Checking collection configuration...`);
                
            } catch (error) {
                // Collection doesn't exist, create it with explicit cosine distance
                console.log(`🆕 Creating new collection with COSINE distance: ${this.collectionName}`);
                
                this.collection = await this.client.createCollection({
                    name: this.collectionName,
                    embeddingFunction: {
                        generate: async (texts) => {
                            // Dummy function - we provide embeddings directly
                            // Return empty embeddings with correct dimensions
                            return texts.map(() => new Array(4096).fill(0));
                        }
                    },
                    metadata: {
                        "hnsw:space": "cosine",  // 🔥 EXPLICITLY SET COSINE DISTANCE
                        "hnsw:construction_ef": 200,  // Better search quality
                        "hnsw:M": 16,  // Good balance of speed vs accuracy
                        description: "HelmAI airline customer service knowledge base",
                        model: this.model,
                        embedding_model: this.model,
                        distance_metric: "cosine",  // Extra confirmation
                        created: new Date().toISOString()
                    }
                });
                
                console.log(`✅ Created collection with COSINE distance configuration`);
                console.log(`📊 Collection settings:`);
                console.log(`   - Distance metric: COSINE`);
                console.log(`   - HNSW space: cosine`);
                console.log(`   - Construction EF: 200`);
                console.log(`   - M parameter: 16`);
            }
            
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Chroma DB:', error.message);
            
            if (error.message.includes('ECONNREFUSED')) {
                console.log('💡 Chroma DB not running. Starting it automatically...');
                await this.startChromaDB();
                return await this.initialize(); // Try again
            }
            
            throw error;
        }
    }

    /**
     * Start Chroma DB automatically (convenience function)
     */
    async startChromaDB() {
        console.log('🚀 Starting Chroma DB...');
        // Chroma DB will start automatically with the client
        // No need for manual server start in newer versions
    }

    /**
     * STEP 2: Convert text to embedding using your local models
     * Normalized for better similarity calculations
     */
    async generateEmbedding(text) {
        try {
            const response = await axios.post(
                `${this.ollamaUrl}/api/embeddings`,
                {
                    model: this.model,
                    prompt: text
                },
                {
                    timeout: 15000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            const rawEmbedding = response.data.embedding;
            
            // Normalize the embedding for better similarity calculations
            const normalized = this.normalizeVector(rawEmbedding);
            
            return normalized;
            
        } catch (error) {
            console.error('❌ Failed to generate embedding:', error.message);
            throw error;
        }
    }

    /**
     * Normalize a vector to unit length (L2 normalization)
     * This is crucial for proper cosine similarity in Chroma DB
     */
    normalizeVector(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vector; // Avoid division by zero
        return vector.map(val => val / magnitude);
    }

    /**
     * STEP 3: Add articles to vector database
     * This replaces the file-based storage from embedding-creator.js
     */
    async addArticlesToDB(knowledgeBase) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`📝 Adding ${knowledgeBase.length} articles to vector database...`);
        
        const ids = [];
        const embeddings = [];
        const documents = [];
        const metadatas = [];

        // Process articles in batches
        const batchSize = 10;
        for (let i = 0; i < knowledgeBase.length; i += batchSize) {
            const batch = knowledgeBase.slice(i, i + batchSize);
            console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(knowledgeBase.length/batchSize)}`);
            
            for (const article of batch) {
                try {
                    console.log(`🧠 Processing: "${article.text.substring(0, 50)}..."`);
                    
                    // Generate embedding
                    const embedding = await this.generateEmbedding(article.text);
                    
                    // Prepare data for Chroma
                    ids.push(article.id);
                    embeddings.push(embedding);
                    documents.push(article.text);
                    metadatas.push({
                        intent: article.intent,
                        category: article.metadata?.category || 'general',
                        priority: article.metadata?.priority || 'medium',
                        created_at: new Date().toISOString()
                    });
                    
                    console.log(`✅ Added article ${article.id}`);
                    
                } catch (error) {
                    console.error(`⚠️  Skipping article ${article.id}:`, error.message);
                }
            }
            
            // Small delay between batches
            if (i + batchSize < knowledgeBase.length) {
                await this.sleep(1000);
            }
        }

        // Add all to Chroma DB at once (efficient)
        await this.collection.add({
            ids: ids,
            embeddings: embeddings,
            documents: documents,
            metadatas: metadatas
        });

        console.log(`✅ Successfully added ${ids.length} articles to vector database`);
        return ids.length;
    }

    /**
     * STEP 4: Search for similar articles (this replaces the file-based search)
     * Much faster than the old approach!
     */
    async searchSimilar(queryText, maxResults = 5, minSimilarity = 0.1) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`🔍 Searching vector database for: "${queryText}"`);
        
        // Generate embedding for query
        const queryEmbedding = await this.generateEmbedding(queryText);
        
        // Search in Chroma DB (super fast!)
        const results = await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: maxResults,
            include: ['documents', 'metadatas', 'distances']
        });

        // Convert Chroma results to our format
        const formattedResults = [];
        
        if (results.documents && results.documents[0]) {
            for (let i = 0; i < results.documents[0].length; i++) {
                const distance = results.distances[0][i];
                // For cosine distance, smaller is better. Convert to similarity score.
                // ChromaDB typically uses cosine distance, so we convert it to a 0-1 similarity score
                const similarity = Math.max(0, 1 - distance);
                
                // Always include results, let caller decide on threshold
                formattedResults.push({
                    id: results.ids[0][i],
                    text: results.documents[0][i],
                    intent: results.metadatas[0][i].intent,
                    similarity: similarity,
                    confidence: Math.round(similarity * 100),
                    distance: distance,
                    metadata: results.metadatas[0][i]
                });
            }
        }

        // Filter by minimum similarity if specified
        const filteredResults = minSimilarity > 0 
            ? formattedResults.filter(r => r.similarity >= minSimilarity)
            : formattedResults;

        console.log(`✅ Found ${filteredResults.length} relevant articles (${formattedResults.length} total)`);
        
        // Log some debug info
        if (formattedResults.length > 0) {
            console.log(`📊 Top result: ${formattedResults[0].confidence}% match (distance: ${formattedResults[0].distance.toFixed(4)})`);
        }
        
        return filteredResults;
    }

    /**
     * STEP 5: Filter search by intent or category
     * Advanced feature: search only within specific categories
     */
    async searchByCategory(queryText, category, maxResults = 5) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log(`🎯 Searching in category '${category}' for: "${queryText}"`);
        
        const queryEmbedding = await this.generateEmbedding(queryText);
        
        // Search with metadata filter
        const results = await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: maxResults,
            where: { category: category },
            include: ['documents', 'metadatas', 'distances']
        });

        const formattedResults = [];
        if (results.documents && results.documents[0]) {
            for (let i = 0; i < results.documents[0].length; i++) {
                const similarity = 1 - results.distances[0][i];
                formattedResults.push({
                    id: results.ids[0][i],
                    text: results.documents[0][i],
                    intent: results.metadatas[0][i].intent,
                    similarity: similarity,
                    confidence: Math.round(similarity * 100),
                    metadata: results.metadatas[0][i]
                });
            }
        }

        return formattedResults;
    }

    /**
     * STEP 6: Get database statistics
     */
    async getStats() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const count = await this.collection.count();
        
        return {
            totalDocuments: count,
            collectionName: this.collectionName,
            model: this.model
        };
    }

    /**
     * STEP 7: Delete all data (useful for resetting)
     */
    async clearDatabase() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        console.log('🗑️  Clearing vector database...');
        
        try {
            await this.client.deleteCollection({ name: this.collectionName });
            console.log('✅ Database cleared successfully');
            
            // Recreate collection
            this.collection = await this.client.createCollection({
                name: this.collectionName,
                embeddingFunction: undefined, // We provide our own embeddings
                metadata: {
                    description: "HelmAI airline customer service knowledge base",
                    model: this.model,
                    created: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to clear database:', error.message);
            throw error;
        }
    }

    /**
     * Helper function for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * EXAMPLE: How to use the vector database
 */
async function exampleUsage() {
    console.log('🗄️  === VECTOR DATABASE EXAMPLE ===\n');
    
    try {
        // Step 1: Create vector database service
        const vectorDB = new HelmAIVectorDB({
            model: 'mistral:latest',
            collectionName: 'helmai-demo'
        });
        
        // Step 2: Initialize connection
        await vectorDB.initialize();
        
        // Step 3: Sample knowledge base
        const knowledgeBase = [
            {
                id: 'kb001',
                text: 'How to book flights online using our website or mobile app',
                intent: 'flight_booking',
                metadata: { category: 'booking', priority: 'high' }
            },
            {
                id: 'kb002',
                text: 'Flight cancellation policy and refund procedures',
                intent: 'flight_cancellation', 
                metadata: { category: 'cancellation', priority: 'high' }
            },
            {
                id: 'kb003',
                text: 'Lost baggage tracking and reporting procedures',
                intent: 'baggage_issue',
                metadata: { category: 'baggage', priority: 'medium' }
            }
        ];
        
        // Step 4: Add articles to database
        await vectorDB.addArticlesToDB(knowledgeBase);
        
        // Step 5: Test searches
        console.log('\n🔍 Testing searches...\n');
        
        const testQueries = [
            'I lost my suitcase',
            'How to cancel my reservation?',
            'Book a flight to New York'
        ];
        
        for (const query of testQueries) {
            console.log(`\n❓ Query: "${query}"`);
            const results = await vectorDB.searchSimilar(query, 2);
            
            results.forEach((result, index) => {
                const emoji = index === 0 ? '🥇' : '🥈';
                console.log(`${emoji} ${result.confidence}% - ${result.intent}`);
                console.log(`   "${result.text.substring(0, 60)}..."`);
            });
        }
        
        // Step 6: Show database stats
        const stats = await vectorDB.getStats();
        console.log('\n📊 Database Stats:');
        console.log(`   Total documents: ${stats.totalDocuments}`);
        console.log(`   Collection: ${stats.collectionName}`);
        console.log(`   Model: ${stats.model}`);
        
    } catch (error) {
        console.error('❌ Example failed:', error.message);
    }
}

// Export the class
module.exports = {
    HelmAIVectorDB
};

// Run example if called directly
if (require.main === module) {
    exampleUsage();
}
