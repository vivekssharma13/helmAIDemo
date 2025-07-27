/**
 * HELMAI VECTOR EMBEDDING SYSTEM
 * 
 * Main entry point for the HelmAI airline customer service 
 * vector embedding and semantic search system.
 * 
 * This system provides:
 * - Semantic search for customer queries
 * - Intent classification
 * - Vector database storage
 * - Local AI model integration (Ollama)
 */

const { EmbeddingCreator } = require('./src/core/embedding-creator');
const { HelmAIVectorDB } = require('./src/core/vector-database');
const { EmbeddingSearcher } = require('./src/services/embedding-searcher');

/**
 * HelmAI Production System
 */
class HelmAIEmbeddingSystem {
    constructor(options = {}) {
        this.model = options.model || 'mistral:latest';
        this.collectionName = options.collectionName || 'helmai-production';
        
        // Initialize core components
        this.creator = new EmbeddingCreator({
            model: this.model,
            collectionName: this.collectionName,
            batchSize: options.batchSize || 5
        });
        
        this.vectorDB = new HelmAIVectorDB({
            model: this.model,
            collectionName: this.collectionName
        });
        
        this.searcher = new EmbeddingSearcher({
            model: this.model,
            collectionName: this.collectionName,
            useVectorDB: true
        });
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize the system and vector database
     */
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing HelmAI Embedding System...');
        await this.vectorDB.initialize();
        this.isInitialized = true;
        console.log('✅ System ready for use!');
    }
    
    /**
     * Create and store embeddings for your knowledge base
     */
    async createKnowledgeBase(knowledgeBase) {
        await this.initialize();
        
        console.log('📚 Creating knowledge base with embeddings...');
        const result = await this.creator.createAndSaveEmbeddings(knowledgeBase, true);
        
        if (result.success) {
            console.log(`✅ Knowledge base created: ${result.embeddingsCount} articles stored`);
        } else {
            throw new Error(`Failed to create knowledge base: ${result.error}`);
        }
        
        return result;
    }
    
    /**
     * Search for answers to customer queries
     */
    async searchForAnswer(query, maxResults = 3, minSimilarity = 0.3) {
        await this.initialize();
        
        console.log(`🔍 Searching for: "${query}"`);
        const results = await this.vectorDB.searchSimilar(query, maxResults, minSimilarity);
        
        if (results.length > 0) {
            console.log(`✅ Found ${results.length} relevant answers`);
            return results.map(result => ({
                intent: result.intent,
                text: result.text,
                confidence: result.confidence,
                similarity: result.similarity,
                category: result.metadata?.category || 'general'
            }));
        } else {
            console.log('❌ No relevant answers found');
            return [];
        }
    }
    
    /**
     * Search within a specific category
     */
    async searchByCategory(query, category, maxResults = 3) {
        await this.initialize();
        
        console.log(`🎯 Searching in category '${category}' for: "${query}"`);
        return await this.vectorDB.searchByCategory(query, category, maxResults);
    }
    
    /**
     * Get comprehensive system statistics
     */
    async getStats() {
        await this.initialize();
        
        try {
            // Get basic collection info (this could be enhanced later)
            const basicStats = {
                model: this.model,
                collection: this.collectionName,
                status: 'ready'
            };
            
            // Get Node.js process information
            const processStats = {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                nodeVersion: process.version,
                platform: process.platform
            };
            
            // Calculate memory usage in MB
            const memoryUsageMB = {
                rss: Math.round(processStats.memory.rss / 1024 / 1024),
                heapTotal: Math.round(processStats.memory.heapTotal / 1024 / 1024),
                heapUsed: Math.round(processStats.memory.heapUsed / 1024 / 1024),
                external: Math.round(processStats.memory.external / 1024 / 1024)
            };
            
            // Try to get vector database stats (if available)
            let vectorDBStats = {};
            try {
                if (this.vectorDB && typeof this.vectorDB.getCollectionStats === 'function') {
                    vectorDBStats = await this.vectorDB.getCollectionStats();
                }
            } catch (error) {
                console.log('⚠️  Could not get vector DB stats:', error.message);
                vectorDBStats = { articleCount: 'unknown', exists: true };
            }
            
            return {
                // Basic system info
                ...basicStats,
                timestamp: new Date().toISOString(),
                
                // Knowledge base statistics
                knowledgeBase: {
                    articleCount: vectorDBStats.articleCount || 'unknown',
                    exists: vectorDBStats.exists !== false,
                    lastUpdated: vectorDBStats.lastUpdated || new Date().toISOString(),
                    approximateSize: vectorDBStats.approximateMemoryUsage 
                        ? `${Math.round(vectorDBStats.approximateMemoryUsage / 1024)}KB`
                        : 'Calculating...'
                },
                
                // Performance metrics
                performance: {
                    search: {
                        totalSearches: vectorDBStats.searchMetrics?.totalSearches || 0,
                        averageResponseTime: vectorDBStats.searchMetrics?.averageResponseTime || 0,
                        fastestSearch: vectorDBStats.performance?.fastestSearch || null,
                        slowestSearch: vectorDBStats.performance?.slowestSearch || null,
                        successRate: vectorDBStats.performance?.successRate || 100,
                        lastSearchTime: vectorDBStats.searchMetrics?.lastSearchTime || null
                    },
                    uptime: `${Math.round(processStats.uptime / 60)} minutes`,
                    responseTime: {
                        fastest: vectorDBStats.performance?.fastestSearch ? `${vectorDBStats.performance.fastestSearch}ms` : 'N/A',
                        slowest: vectorDBStats.performance?.slowestSearch ? `${vectorDBStats.performance.slowestSearch}ms` : 'N/A',
                        average: vectorDBStats.searchMetrics?.averageResponseTime ? `${Math.round(vectorDBStats.searchMetrics.averageResponseTime)}ms` : 'N/A'
                    }
                },
                
                // System resources
                system: {
                    memoryUsage: memoryUsageMB,
                    nodeVersion: processStats.nodeVersion,
                    platform: processStats.platform,
                    cpuTime: {
                        user: `${Math.round(processStats.cpuUsage.user / 1000)}ms`,
                        system: `${Math.round(processStats.cpuUsage.system / 1000)}ms`
                    }
                },
                
                // Health indicators
                health: {
                    vectorDatabase: vectorDBStats.exists ? 'healthy' : 'no_data',
                    searchCapability: (vectorDBStats.articleCount || 0) > 0 ? 'ready' : 'empty',
                    memoryStatus: memoryUsageMB.heapUsed < 100 ? 'good' : 'high',
                    overallStatus: this.calculateOverallHealth(vectorDBStats, memoryUsageMB)
                },
                
                // Additional computed metrics
                computed: {
                    articlesPerMB: (vectorDBStats.articleCount || 0) > 0 && memoryUsageMB.heapUsed > 0
                        ? Math.round((vectorDBStats.articleCount || 0) / memoryUsageMB.heapUsed)
                        : 0,
                    searchEfficiency: (vectorDBStats.searchMetrics?.totalSearches || 0) > 0 && (vectorDBStats.searchMetrics?.averageResponseTime || 0) > 0
                        ? Math.round(1000 / vectorDBStats.searchMetrics.averageResponseTime) // searches per second
                        : 0,
                    memoryEfficiency: memoryUsageMB.heapUsed > 0
                        ? Math.round((memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) * 100)
                        : 0
                },
                
                // Recommendations
                recommendations: this.generateHealthRecommendations(vectorDBStats, memoryUsageMB)
            };
            
        } catch (error) {
            console.error('❌ Failed to get comprehensive stats:', error.message);
            
            // Return basic stats if detailed stats fail
            return {
                model: this.model,
                collection: this.collectionName,
                status: 'ready',
                error: 'Failed to get detailed statistics',
                basicStats: true,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Calculate overall system health
     */
    calculateOverallHealth(vectorDBStats, memoryUsage) {
        if (!vectorDBStats.exists) return 'unhealthy';
        if ((vectorDBStats.articleCount || 0) === 0) return 'no_data';
        if (memoryUsage.heapUsed > 200) return 'memory_high';
        return 'healthy';
    }
    
    /**
     * Generate health recommendations
     */
    generateHealthRecommendations(vectorDBStats, memoryUsage) {
        const recommendations = [];
        
        if (!vectorDBStats.exists) {
            recommendations.push('Create a knowledge base to enable search functionality');
        }
        
        if ((vectorDBStats.articleCount || 0) === 0) {
            recommendations.push('Add articles to the knowledge base for better search results');
        }
        
        if (memoryUsage.heapUsed > 150) {
            recommendations.push('Consider restarting the service to free up memory');
        }
        
        if ((vectorDBStats.searchMetrics?.averageResponseTime || 0) > 2000) {
            recommendations.push('Search response time is high, consider optimizing the knowledge base');
        }
        
        if ((vectorDBStats.performance?.successRate || 100) < 95) {
            recommendations.push('Search success rate is low, check for system errors');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is running optimally');
        }
        
        return recommendations;
    }
}

// Export for use in other modules
module.exports = {
    HelmAIEmbeddingSystem,
    EmbeddingCreator,
    HelmAIVectorDB,
    EmbeddingSearcher
};

// CLI interface if run directly
async function main() {
    if (require.main !== module) return;
    
    console.log('🛫 === HELMAI EMBEDDING SYSTEM DEMO ===\n');
    
    // Example airline knowledge base
    const airlineKB = [
        {
            id: 'booking_001',
            text: 'To book a flight, visit our website, select your departure and destination cities, choose travel dates, and complete payment.',
            intent: 'flight_booking',
            metadata: { category: 'booking', priority: 'high' }
        },
        {
            id: 'cancel_001',
            text: 'Flight cancellations are free within 24 hours of booking. After 24 hours, cancellation fees may apply based on your ticket type.',
            intent: 'flight_cancellation',
            metadata: { category: 'cancellation', priority: 'high' }
        },
        {
            id: 'baggage_001',
            text: 'If your baggage is lost or delayed, report it immediately at our baggage service counter or online through our baggage tracking system.',
            intent: 'baggage_issue',
            metadata: { category: 'baggage', priority: 'medium' }
        }
    ];
    
    const system = new HelmAIEmbeddingSystem({
        model: 'mistral:latest',
        collectionName: 'helmai-demo'
    });
    
    try {
        // Create knowledge base
        await system.createKnowledgeBase(airlineKB);
        
        // Test searches
        const queries = [
            'How do I book a flight?',
            'I want to cancel my ticket',
            'My luggage is missing'
        ];
        
        for (const query of queries) {
            console.log(`\n${'='.repeat(50)}`);
            const answers = await system.searchForAnswer(query, 2, 0.3);
            
            if (answers.length > 0) {
                answers.forEach((answer, i) => {
                    console.log(`${i + 1}. ${answer.intent} (${answer.confidence}% confidence)`);
                    console.log(`   Category: ${answer.category}`);
                    console.log(`   Answer: ${answer.text.substring(0, 80)}...`);
                });
            }
        }
        
        console.log(`\n${'='.repeat(50)}`);
        console.log('🎉 Demo completed successfully!');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
    }
}

if (require.main === module) {
    main();
}
