/**
 * EMBEDDING SEARCHER - File 2 of 2
 * 
 * This file is responsible for:
 * 1. Taking user queries (like "I lost my baggage")
 * 2. Converting the query to numbers (embedding)
 * 3. Finding the most similar articles from your knowledge base
 * 4. Returning the best answers
 * 
 * Think of this as using your "index cards" to quickly find the right book
 * You run this EVERY TIME a customer asks a question
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { HelmAIVectorDB } = require('../core/vector-database');

/**
 * Fast Embedding Searcher for Customer Queries
 * This handles the "fast search" when customers ask questions
 */
class EmbeddingSearcher {
    constructor(options = {}) {
        this.ollamaUrl = options.ollamaUrl || 'http://localhost:11434';
        this.model = options.model || 'mistral:latest';
        this.storageFolder = options.storageFolder || './embeddings-storage';
        this.knowledgeBase = null; // Will load from file or vector DB
        this.isLoaded = false;
        
        // Vector database integration
        this.vectorDB = new HelmAIVectorDB({
            ollamaUrl: this.ollamaUrl,
            model: this.model,
            collectionName: options.collectionName || 'helmai-production'
        });
        this.useVectorDB = options.useVectorDB !== false; // Default to true
    }

    /**
     * STEP 1: Load your pre-computed embeddings from file
     * This is like opening your filing cabinet with all the index cards
     * Call this ONCE when your app starts
     */
    async loadKnowledgeBase(filename = 'helmai-knowledge-base.json') {
        try {
            const filePath = path.join(this.storageFolder, filename);
            console.log(`📂 Loading knowledge base from ${filePath}...`);
            
            const fileData = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(fileData);
            
            this.knowledgeBase = data;
            this.isLoaded = true;
            
            console.log('✅ Knowledge base loaded successfully!');
            console.log(`📊 Loaded ${data.totalEmbeddings} articles`);
            console.log(`🤖 Model used: ${data.model}`);
            console.log(`📅 Created: ${new Date(data.createdAt).toLocaleDateString()}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to load knowledge base:', error.message);
            console.log('💡 Make sure you ran the embedding-creator.js file first!');
            throw error;
        }
    }

    /**
     * STEP 2: Convert user query to embedding (numbers)
     * This is like creating an index card for the customer's question
     */
    async convertQueryToEmbedding(queryText) {
        try {
            console.log(`🔍 Converting query: "${queryText}"`);
            
            const response = await axios.post(
                `${this.ollamaUrl}/api/embeddings`,
                {
                    model: this.model,
                    prompt: queryText
                },
                {
                    timeout: 15000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            const embedding = response.data.embedding;
            console.log(`✅ Query converted to ${embedding.length} numbers`);
            
            return embedding;
            
        } catch (error) {
            console.error('❌ Failed to convert query:', error.message);
            throw error;
        }
    }

    /**
     * STEP 3: Calculate how similar two embeddings are
     * This is like comparing two index cards to see if they're about the same topic
     */
    calculateSimilarity(embedding1, embedding2) {
        // Make sure both embeddings have same length
        if (embedding1.length !== embedding2.length) {
            throw new Error('Embeddings must have same length');
        }
        
        // Calculate cosine similarity (fancy math to compare similarity)
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            magnitude1 += embedding1[i] * embedding1[i];
            magnitude2 += embedding2[i] * embedding2[i];
        }
        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0; // avoid divide by zero
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);
        
        // Return similarity score (0 = not similar, 1 = very similar)
        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * STEP 4: Find most similar articles to user query
     * This is like looking through all your index cards to find the best matches
     */
    async searchSimilarArticles(queryText, maxResults = 5, minSimilarity = 0.3) {
        // Make sure knowledge base is loaded
        if (!this.isLoaded) {
            throw new Error('Knowledge base not loaded. Call loadKnowledgeBase() first!');
        }
        
        console.log(`🎯 Searching for: "${queryText}"`);
        console.log(`📋 Checking ${this.knowledgeBase.totalEmbeddings} articles...`);
        
        // Step 1: Convert user query to embedding
        const queryEmbedding = await this.convertQueryToEmbedding(queryText);
        
        // Step 2: Compare query against all stored articles
        const similarities = [];
        
        for (const article of this.knowledgeBase.embeddings) {
            const similarity = this.calculateSimilarity(queryEmbedding, article.embedding);
            
            // Only keep articles that are similar enough
            if (similarity >= minSimilarity) {
                similarities.push({
                    id: article.id,
                    text: article.text,
                    intent: article.intent,
                    similarity: similarity,
                    confidence: Math.round(similarity * 100), // Convert to percentage
                    metadata: article.metadata
                });
            }
        }
        
        // Step 3: Sort by similarity (best matches first)
        similarities.sort((a, b) => b.similarity - a.similarity);
        
        // Step 4: Return only the top results
        const topResults = similarities.slice(0, maxResults);
        
        console.log(`✅ Found ${topResults.length} relevant articles`);
        
        return topResults;
    }

    /**
     * STEP 5: Get the best answer for a customer query
     * This is the main function you'll call when a customer asks something
     */
    async findBestAnswer(customerQuery, options = {}) {
        const maxResults = options.maxResults || 3;
        const minConfidence = options.minConfidence || 30; // 30% minimum confidence
        
        try {
            console.log('\n🚁 === HELMAI ANSWER SEARCH ===');
            console.log(`❓ Customer Query: "${customerQuery}"`);
            
            // Search for similar articles
            const results = await this.searchSimilarArticles(
                customerQuery, 
                maxResults, 
                minConfidence / 100
            );
            
            if (results.length === 0) {
                return {
                    success: false,
                    message: 'No relevant answers found',
                    query: customerQuery,
                    suggestions: ['Try rephrasing your question', 'Contact human support']
                };
            }
            
            // Return the results with confidence scores
            const response = {
                success: true,
                query: customerQuery,
                bestMatch: results[0],
                allMatches: results,
                totalFound: results.length
            };
            
            // Display results nicely
            console.log('\n🎯 SEARCH RESULTS:');
            results.forEach((result, index) => {
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                console.log(`${emoji} ${result.confidence}% - ${result.intent}`);
                console.log(`   "${result.text.substring(0, 80)}..."`);
            });
            
            return response;
            
        } catch (error) {
            console.error('❌ Search failed:', error.message);
            return {
                success: false,
                error: error.message,
                query: customerQuery
            };
        }
    }

    /**
     * STEP 6: Classify customer intent (what do they want?)
     * This helps you understand what type of help the customer needs
     */
    async classifyIntent(customerQuery) {
        const results = await this.searchSimilarArticles(customerQuery, 1, 0.2);
        
        if (results.length > 0) {
            const bestMatch = results[0];
            return {
                intent: bestMatch.intent,
                confidence: bestMatch.confidence,
                text: bestMatch.text
            };
        }
        
        return {
            intent: 'unknown',
            confidence: 0,
            text: 'Could not classify intent'
        };
    }

    /**
     * STEP 7: Special handling for crew emergencies
     * This gives priority to crew emergency requests
     */
    async handleCrewQuery(crewQuery, crewId = null) {
        console.log('🚨 === CREW EMERGENCY HANDLER ===');
        console.log(`👩‍✈️ Crew Query: "${crewQuery}"`);
        
        const result = await this.findBestAnswer(crewQuery);
        
        // Check if this is an emergency
        if (result.success && result.bestMatch.intent === 'crew_emergency') {
            return {
                ...result,
                priority: 'EMERGENCY',
                escalate: true,
                response: 'Emergency protocol activated. Connecting to priority support immediately.'
            };
        }
        
        return {
            ...result,
            priority: 'NORMAL',
            escalate: false
        };
    }
}

/**
 * EXAMPLE: How to use this file
 * Copy this code and modify it for your needs
 */
async function exampleUsage() {
    console.log('🔍 === EXAMPLE: Searching Knowledge Base ===\n');
    
    try {
        // Step 1: Create the searcher
        const searcher = new EmbeddingSearcher({
            model: 'mistral:latest'
        });
        
        // Step 2: Load your knowledge base (created by embedding-creator.js)
        await searcher.loadKnowledgeBase('helmai-knowledge-base.json');
        
        // Step 3: Test some customer queries
        const testQueries = [
            "I lost my suitcase at the airport",
            "How do I cancel my flight booking?", 
            "Emergency! Need immediate assistance",
            "What's the status of my flight?"
        ];
        
        for (const query of testQueries) {
            console.log('\n' + '='.repeat(50));
            
            // Regular customer query
            if (query.includes('Emergency')) {
                // Handle as crew emergency
                const result = await searcher.handleCrewQuery(query, 'crew123');
                console.log(`🚨 Priority: ${result.priority}`);
                if (result.escalate) {
                    console.log('🚁 ESCALATING TO EMERGENCY SUPPORT');
                }
            } else {
                // Handle as regular customer
                const result = await searcher.findBestAnswer(query);
                if (result.success) {
                    console.log(`💡 Best Answer: ${result.bestMatch.text.substring(0, 100)}...`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Example failed:', error.message);
        console.log('💡 Make sure to run embedding-creator.js first!');
    }
}

// Export the class so other files can use it
module.exports = {
    EmbeddingSearcher
};

// Run example if this file is called directly
if (require.main === module) {
    exampleUsage();
}
