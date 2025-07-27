#!/usr/bin/env node

/**
 * HELMAI API LAUNCHER
 * 
 * Quick launcher script to start the HelmAI REST API server.
 * This is what you'll use to start the API for frontend integration.
 */

const { HelmAIAPIServer } = require('./server');

// Configuration
const config = {
    port: process.env.PORT || 3001,
    model: process.env.OLLAMA_MODEL || 'mistral:latest',
    collectionName: process.env.COLLECTION_NAME || 'helmai-production'
};

// Create and start server
async function startAPI() {
    try {
        console.log('🎯 HelmAI API Launcher');
        console.log('=====================');
        console.log(`Port: ${config.port}`);
        console.log(`Model: ${config.model}`);
        console.log(`Collection: ${config.collectionName}`);
        console.log('');
        
        const server = new HelmAIAPIServer(config);
        await server.start();
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
            await server.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start HelmAI API:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the API
if (require.main === module) {
    startAPI();
}

module.exports = { startAPI, config };
