/**
 * HELMAI REST API SERVER
 * 
 * This Express.js server provides REST endpoints for the HelmAI 
 * vector embedding and semantic search system.
 * 
 * Frontend can call these endpoints to:
 * - Search for answers to user queries
 * - Get system status
 * - Manage knowledge base
 */

const express = require('express');
const cors = require('cors');
const { HelmAIEmbeddingSystem } = require('../../helmai-system');

class HelmAIAPIServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 3000;
        this.helmAI = new HelmAIEmbeddingSystem({
            model: options.model || 'mistral:latest',
            collectionName: options.collectionName || 'helmai-production'
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.isInitialized = false;
    }
    
    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Enable CORS for frontend requests
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
            credentials: true
        }));
        
        // Parse JSON requests
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/api/health', this.handleHealth.bind(this));
        
        // Main search endpoint - This is what frontend will call
        this.app.post('/api/search', this.handleSearch.bind(this));
        
        // Category search endpoint
        this.app.post('/api/search/category', this.handleCategorySearch.bind(this));
        
        // Knowledge base management
        this.app.post('/api/knowledge-base/create', this.handleCreateKnowledgeBase.bind(this));
        this.app.get('/api/knowledge-base/stats', this.handleGetStats.bind(this));
        
        // System endpoints
        this.app.post('/api/system/initialize', this.handleInitialize.bind(this));
        this.app.get('/api/system/status', this.handleSystemStatus.bind(this));
        
        // Error handling
        this.app.use(this.handleError.bind(this));
        
        // 404 handler - use a different approach
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                availableEndpoints: [
                    'POST /api/search',
                    'POST /api/search/category',
                    'GET /api/health',
                    'GET /api/system/status'
                ]
            });
        });
    }
    
    /**
     * 🎯 MAIN ENDPOINT: Search for answers (Frontend calls this)
     */
    async handleSearch(req, res) {
        try {
            const { query, maxResults = 3, minSimilarity = 0.3 } = req.body;
            
            // Validate input
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Query is required and must be a non-empty string'
                });
            }
            
            // Ensure system is initialized
            await this.ensureInitialized();
            
            console.log(`🔍 API Search: "${query}"`);
            
            // Search for answers
            const results = await this.helmAI.searchForAnswer(
                query.trim(), 
                parseInt(maxResults) || 3, 
                parseFloat(minSimilarity) || 0.3
            );
            
            // Format response for frontend
            const response = {
                success: true,
                query: query.trim(),
                results: results,
                resultCount: results.length,
                timestamp: new Date().toISOString()
            };
            
            console.log(`✅ API Response: ${results.length} results found`);
            res.json(response);
            
        } catch (error) {
            console.error('❌ Search API Error:', error);
            res.status(500).json({
                success: false,
                error: 'Search failed',
                message: error.message
            });
        }
    }
    
    /**
     * Category-specific search endpoint
     */
    async handleCategorySearch(req, res) {
        try {
            const { query, category, maxResults = 3 } = req.body;
            
            if (!query || !category) {
                return res.status(400).json({
                    success: false,
                    error: 'Both query and category are required'
                });
            }
            
            await this.ensureInitialized();
            
            const results = await this.helmAI.searchByCategory(
                query.trim(), 
                category.trim(), 
                parseInt(maxResults) || 3
            );
            
            res.json({
                success: true,
                query: query.trim(),
                category: category.trim(),
                results: results,
                resultCount: results.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Category Search API Error:', error);
            res.status(500).json({
                success: false,
                error: 'Category search failed',
                message: error.message
            });
        }
    }
    
    /**
     * Health check endpoint
     */
    async handleHealth(req, res) {
        try {
            const status = {
                success: true,
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                system: 'HelmAI Embedding API'
            };
            
            // Try to check if system is responsive
            if (this.isInitialized) {
                status.initialized = true;
                status.model = this.helmAI.model;
                status.collection = this.helmAI.collectionName;
            } else {
                status.initialized = false;
            }
            
            res.json(status);
        } catch (error) {
            res.status(500).json({
                success: false,
                status: 'unhealthy',
                error: error.message
            });
        }
    }
    
    /**
     * Initialize system endpoint
     */
    async handleInitialize(req, res) {
        try {
            console.log('🚀 Initializing HelmAI system via API...');
            await this.helmAI.initialize();
            this.isInitialized = true;
            
            res.json({
                success: true,
                message: 'HelmAI system initialized successfully',
                model: this.helmAI.model,
                collection: this.helmAI.collectionName,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            res.status(500).json({
                success: false,
                error: 'Initialization failed',
                message: error.message
            });
        }
    }
    
    /**
     * System status endpoint
     */
    async handleSystemStatus(req, res) {
        try {
            const stats = await this.helmAI.getStats();
            
            res.json({
                success: true,
                status: this.isInitialized ? 'ready' : 'not_initialized',
                stats: stats,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get system status',
                message: error.message
            });
        }
    }
    
    /**
     * Create knowledge base endpoint
     */
    async handleCreateKnowledgeBase(req, res) {
        try {
            const { knowledgeBase } = req.body;
            
            if (!knowledgeBase || !Array.isArray(knowledgeBase)) {
                return res.status(400).json({
                    success: false,
                    error: 'knowledgeBase must be an array of articles'
                });
            }
            
            await this.ensureInitialized();
            
            const result = await this.helmAI.createKnowledgeBase(knowledgeBase);
            
            res.json({
                success: true,
                message: 'Knowledge base created successfully',
                result: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Knowledge base creation failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create knowledge base',
                message: error.message
            });
        }
    }
    
    /**
     * Get comprehensive system stats endpoint with optional filtering
     * 
     * Query parameters:
     * - ?detailed=true : Include all detailed metrics
     * - ?performance=true : Include performance metrics
     * - ?health=true : Include health status
     * - ?recommendations=true : Include recommendations
     * - ?format=summary : Return condensed summary
     */
    async handleGetStats(req, res) {
        try {
            await this.ensureInitialized();
            const stats = await this.helmAI.getStats();
            
            // Get query parameters for filtering
            const {
                detailed = 'false',
                performance = 'true',
                health = 'true',
                recommendations = 'true',
                format = 'full'
            } = req.query;
            
            let response = {
                success: true,
                timestamp: new Date().toISOString()
            };
            
            // Build response based on query parameters
            if (format === 'summary') {
                // Condensed summary format
                response.summary = {
                    model: stats.model,
                    collection: stats.collection,
                    status: stats.status,
                    articleCount: stats.knowledgeBase.articleCount,
                    overallHealth: stats.health.overallStatus,
                    uptime: stats.performance.uptime,
                    memoryUsed: `${stats.system.memoryUsage.heapUsed}MB`,
                    searchCount: stats.performance.search.totalSearches,
                    avgResponseTime: stats.performance.responseTime.average
                };
            } else {
                // Full stats with selective inclusion
                response.stats = {
                    // Always include basic info
                    model: stats.model,
                    collection: stats.collection,
                    status: stats.status,
                    timestamp: stats.timestamp,
                    knowledgeBase: stats.knowledgeBase,
                    system: stats.system
                };
                
                // Conditionally include sections
                if (performance === 'true') {
                    response.stats.performance = stats.performance;
                    response.stats.computed = stats.computed;
                }
                
                if (health === 'true') {
                    response.stats.health = stats.health;
                }
                
                if (recommendations === 'true') {
                    response.stats.recommendations = stats.recommendations;
                }
                
                if (detailed === 'true') {
                    // Include everything
                    response.stats = stats;
                    response.additionalMetrics = {
                        apiUptime: process.uptime(),
                        nodeMemory: process.memoryUsage(),
                        apiVersion: '2.0.0',
                        endpoints: [
                            'POST /api/search',
                            'POST /api/search/category',
                            'GET /api/health',
                            'GET /api/system/status',
                            'POST /api/knowledge-base/create',
                            'GET /api/knowledge-base/stats'
                        ]
                    };
                }
            }
            
            res.json(response);
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get stats',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Error handling middleware
     */
    handleError(error, req, res, next) {
        console.error('🚨 API Error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Ensure system is initialized
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            console.log('🔄 Auto-initializing HelmAI system...');
            await this.helmAI.initialize();
            this.isInitialized = true;
        }
    }
    
    /**
     * Start the API server
     */
    async start() {
        try {
            // Initialize the HelmAI system
            console.log('🚀 Starting HelmAI API Server...');
            await this.helmAI.initialize();
            this.isInitialized = true;
            
            // Start Express server
            this.server = this.app.listen(this.port, () => {
                console.log(`✅ HelmAI API Server running on http://localhost:${this.port}`);
                console.log('📡 Available endpoints:');
                console.log(`   POST http://localhost:${this.port}/api/search - Main search endpoint`);
                console.log(`   POST http://localhost:${this.port}/api/search/category - Category search`);
                console.log(`   GET  http://localhost:${this.port}/api/health - Health check`);
                console.log(`   GET  http://localhost:${this.port}/api/system/status - System status`);
            });
            
            return this.server;
        } catch (error) {
            console.error('❌ Failed to start API server:', error);
            throw error;
        }
    }
    
    /**
     * Stop the API server
     */
    async stop() {
        if (this.server) {
            console.log('🛑 Stopping HelmAI API Server...');
            this.server.close();
            console.log('✅ Server stopped');
        }
    }
}

module.exports = { HelmAIAPIServer };
