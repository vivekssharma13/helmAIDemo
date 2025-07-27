#!/usr/bin/env node

/**
 * HELMAI INFRASTRUCTURE STARTUP SCRIPT
 * 
 * This script automatically starts all required services for HelmAI:
 * 1. Chroma DB (Docker container)
 * 2. Ollama service 
 * 3. Downloads required AI models
 * 4. Initializes the knowledge base
 * 5. Starts the REST API server
 * 
 * Usage: node start-helmai.js
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class HelmAIInfrastructure {
    constructor() {
        this.chromaContainer = null;
        this.ollamaProcess = null;
        this.apiProcess = null;
        this.isShuttingDown = false;
        
        // Configuration
        this.config = {
            chromaPort: 8000,
            apiPort: 3001,
            ollamaModel: 'mistral:latest',
            chromaImage: 'chromadb/chroma:latest',
            chromaContainer: 'helmai-chroma'
        };
    }

    /**
     * Main startup sequence
     */
    async start() {
        console.log('🚀 === HELMAI INFRASTRUCTURE STARTUP ===\n');
        
        try {
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            // Step 1: Check prerequisites
            await this.checkPrerequisites();
            
            // Step 2: Start Chroma DB
            await this.startChromaDB();
            
            // Step 3: Start Ollama
            await this.startOllama();
            
            // Step 4: Download AI models
            await this.ensureModels();
            
            // Step 5: Wait for services to be ready
            await this.waitForServices();
            
            // Step 6: Initialize knowledge base
            await this.initializeKnowledgeBase();
            
            // Step 7: Start REST API
            await this.startAPI();
            
            console.log('\n🎉 === HELMAI INFRASTRUCTURE READY ===');
            console.log('🌐 API Server: http://localhost:3001');
            console.log('🗄️  Chroma DB: http://localhost:8000');
            console.log('\n📡 Try the API:');
            console.log('curl -X POST http://localhost:3001/api/search \\');
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -d \'{"query": "How do I book a flight?"}\'');
            console.log('\n🛑 Press Ctrl+C to stop all services\n');
            
            // Keep the process alive
            await this.keepAlive();
            
        } catch (error) {
            console.error('❌ Startup failed:', error.message);
            await this.cleanup();
            process.exit(1);
        }
    }

    /**
     * Check if required tools are installed
     */
    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check Docker
        try {
            await this.execCommand('docker --version');
            console.log('✅ Docker is available');
        } catch (error) {
            throw new Error('Docker is not installed or not running. Please install Docker first.');
        }
        
        // Check if Ollama is installed
        try {
            await this.execCommand('ollama --version');
            console.log('✅ Ollama is available');
        } catch (error) {
            console.log('⚠️  Ollama not found. Will try to start without it...');
        }
        
        console.log('');
    }

    /**
     * Start Chroma DB container with persistent storage
     */
    async startChromaDB() {
        console.log('🗄️  Starting Chroma DB with persistent storage...');
        
        try {
            // Create persistent data directory
            const dataDir = path.resolve('./data/chromadb-data');
            try {
                await fs.mkdir(dataDir, { recursive: true });
                console.log(`📁 Created persistent data directory: ${dataDir}`);
            } catch (error) {
                console.log(`📁 Using existing data directory: ${dataDir}`);
            }
            
            // Stop existing container if running
            try {
                await this.execCommand(`docker stop ${this.config.chromaContainer} 2>/dev/null || true`);
                await this.execCommand(`docker rm ${this.config.chromaContainer} 2>/dev/null || true`);
            } catch (e) {
                // Ignore errors - container might not exist
            }
            
            // Pull latest image
            console.log('📥 Pulling Chroma DB image...');
            await this.execCommand(`docker pull ${this.config.chromaImage}`);
            
            // Start container with persistent volume
            const chromaCmd = `docker run -d --name ${this.config.chromaContainer} ` +
                             `-p ${this.config.chromaPort}:8000 ` +
                             `-v "${dataDir}:/data" ` +
                             `-e CHROMA_SERVER_CORS_ALLOW_ORIGINS="*" ` +
                             `${this.config.chromaImage}`;
            
            console.log('🚀 Starting ChromaDB with persistent volume...');
            await this.execCommand(chromaCmd);
            
            console.log('✅ Chroma DB container started with persistent storage');
            
            // Wait for container to be ready
            console.log('⏳ Waiting for Chroma DB to be ready...');
            await this.waitForService(`http://localhost:${this.config.chromaPort}/api/v1/heartbeat`, 30000);
            console.log('✅ Chroma DB is ready!\n');
            
        } catch (error) {
            throw new Error(`Failed to start Chroma DB: ${error.message}`);
        }
    }

    /**
     * Start Ollama service
     */
    async startOllama() {
        console.log('🤖 Starting Ollama...');
        
        try {
            // Check if Ollama is already running
            try {
                await this.execCommand('curl -s http://localhost:11434/api/tags');
                console.log('✅ Ollama is already running\n');
                return;
            } catch (e) {
                // Ollama not running, start it
            }
            
            // Start Ollama in background
            console.log('🚀 Starting Ollama service...');
            this.ollamaProcess = spawn('ollama', ['serve'], {
                detached: false,
                stdio: 'pipe'
            });
            
            // Wait for Ollama to start
            await this.waitForService('http://localhost:11434/api/tags', 15000);
            console.log('✅ Ollama is ready!\n');
            
        } catch (error) {
            console.log('⚠️  Could not start Ollama automatically. Please start it manually with: ollama serve\n');
        }
    }

    /**
     * Ensure required AI models are downloaded
     */
    async ensureModels() {
        console.log('📚 Checking AI models...');
        
        try {
            // Check if model exists
            const models = await this.execCommand('ollama list');
            
            if (!models.includes(this.config.ollamaModel.split(':')[0])) {
                console.log(`📥 Downloading ${this.config.ollamaModel}... (this may take a few minutes)`);
                await this.execCommand(`ollama pull ${this.config.ollamaModel}`);
                console.log('✅ Model downloaded successfully');
            } else {
                console.log(`✅ Model ${this.config.ollamaModel} is available`);
            }
            
            console.log('');
            
        } catch (error) {
            console.log('⚠️  Could not check/download models. Manual setup may be required.\n');
        }
    }

    /**
     * Wait for all services to be ready
     */
    async waitForServices() {
        console.log('⏳ Final service checks...');
        
        // Double-check Chroma DB
        await this.waitForService(`http://localhost:${this.config.chromaPort}/api/v1/heartbeat`, 10000);
        console.log('✅ Chroma DB confirmed ready');
        
        // Check Ollama
        try {
            await this.waitForService('http://localhost:11434/api/tags', 5000);
            console.log('✅ Ollama confirmed ready');
        } catch (e) {
            console.log('⚠️  Ollama check failed - continuing anyway');
        }
        
        console.log('');
    }

    /**
     * Initialize the knowledge base (only if empty)
     */
    async initializeKnowledgeBase() {
        console.log('📚 Checking knowledge base...');
        
        try {
            // Import the HelmAI system
            const { HelmAIEmbeddingSystem } = require('./helmai-system');
            
            // Use the production system with correct collection name
            const system = new HelmAIEmbeddingSystem({
                model: this.config.ollamaModel,
                collectionName: 'helmai-production'  // Match API server collection
            });
            
            // Initialize system
            await system.initialize();
            
            // Check if data already exists
            try {
                const stats = await system.getStats();
                const existingCount = stats?.knowledgeBase?.articleCount || 0;
                
                if (existingCount > 0) {
                    console.log(`✅ Knowledge base already exists with ${existingCount} articles`);
                    console.log('📄 Using persistent data from previous sessions\n');
                    return;
                }
            } catch (error) {
                console.log('🔍 No existing data found, creating initial knowledge base...');
            }
            
            // Create initial knowledge base only if empty
            console.log('🔄 Creating initial knowledge base...');
            
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
                },
                {
                    id: 'checkin_001',
                    text: 'Check in online 24 hours before your flight departure using our website or mobile app with your booking reference.',
                    intent: 'check_in',
                    metadata: { category: 'check-in', priority: 'high' }
                },
                {
                    id: 'status_001',
                    text: 'Check flight status and delay information in real-time on our website or by calling customer service.',
                    intent: 'flight_status',
                    metadata: { category: 'status', priority: 'medium' }
                }
            ];
            
            await system.createKnowledgeBase(airlineKB);
            console.log('✅ Initial knowledge base created');
            console.log('💡 To load your full 420-article dataset, run: npm run import-csv');
            console.log('   This will permanently add all data to the persistent storage\n');
            
        } catch (error) {
            console.log('⚠️  Knowledge base initialization had issues - API will handle this automatically\n');
        }
    }

    /**
     * Start the REST API server
     */
    async startAPI() {
        console.log('🌐 Starting REST API server...');
        
        return new Promise((resolve, reject) => {
            this.apiProcess = spawn('node', ['src/api/app.js'], {
                stdio: 'pipe',
                env: { 
                    ...process.env, 
                    PORT: this.config.apiPort 
                }
            });
            
            let output = '';
            
            this.apiProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                // Look for success message
                if (text.includes('HelmAI API Server running')) {
                    console.log('✅ REST API server started successfully\n');
                    resolve();
                }
                
                // Forward API logs with prefix
                text.split('\n').forEach(line => {
                    if (line.trim()) {
                        console.log(`[API] ${line}`);
                    }
                });
            });
            
            this.apiProcess.stderr.on('data', (data) => {
                console.error(`[API ERROR] ${data.toString()}`);
            });
            
            this.apiProcess.on('error', (error) => {
                reject(new Error(`Failed to start API: ${error.message}`));
            });
            
            this.apiProcess.on('exit', (code) => {
                if (code !== 0 && !this.isShuttingDown) {
                    console.error(`API process exited with code ${code}`);
                }
            });
            
            // Timeout if API doesn't start in 30 seconds
            setTimeout(() => {
                if (!output.includes('HelmAI API Server running')) {
                    reject(new Error('API server startup timeout'));
                }
            }, 30000);
        });
    }

    /**
     * Wait for a service to be ready
     */
    async waitForService(url, timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                await this.execCommand(`curl -s ${url}`);
                return true;
            } catch (error) {
                await this.sleep(1000);
            }
        }
        
        throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
    }

    /**
     * Execute a shell command
     */
    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Setup graceful shutdown handlers
     */
    setupGracefulShutdown() {
        const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
        
        signals.forEach(signal => {
            process.on(signal, async () => {
                console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
                this.isShuttingDown = true;
                await this.cleanup();
                process.exit(0);
            });
        });
        
        process.on('uncaughtException', async (error) => {
            console.error('🚨 Uncaught Exception:', error);
            await this.cleanup();
            process.exit(1);
        });
    }

    /**
     * Keep the main process alive
     */
    async keepAlive() {
        // Keep process alive and monitor services
        while (!this.isShuttingDown) {
            await this.sleep(5000);
            
            // Optional: Health checks could go here
        }
    }

    /**
     * Cleanup all services
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up services...');
        
        // Stop API process
        if (this.apiProcess && !this.apiProcess.killed) {
            console.log('🛑 Stopping API server...');
            this.apiProcess.kill('SIGTERM');
        }
        
        // Stop Ollama process
        if (this.ollamaProcess && !this.ollamaProcess.killed) {
            console.log('🛑 Stopping Ollama...');
            this.ollamaProcess.kill('SIGTERM');
        }
        
        // Stop Chroma DB container
        try {
            console.log('🛑 Stopping Chroma DB...');
            await this.execCommand(`docker stop ${this.config.chromaContainer}`);
            await this.execCommand(`docker rm ${this.config.chromaContainer}`);
            console.log('✅ Chroma DB stopped');
        } catch (error) {
            // Container might not be running
        }
        
        console.log('✅ Cleanup completed');
    }
}

// Start the infrastructure
if (require.main === module) {
    const infrastructure = new HelmAIInfrastructure();
    infrastructure.start().catch(error => {
        console.error('❌ Infrastructure startup failed:', error);
        process.exit(1);
    });
}

module.exports = { HelmAIInfrastructure };
