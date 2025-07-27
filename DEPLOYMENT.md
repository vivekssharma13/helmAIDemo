# 🚀 HelmAI Complete Deployment Guide

This guide provides step-by-step instructions to deploy the HelmAI airline customer service system from scratch. Follow these steps exactly for a successful deployment.

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] macOS, Linux, or Windows with WSL2
- [ ] Administrative/sudo access
- [ ] Internet connection (for downloading models)
- [ ] 10GB+ free disk space
- [ ] 8GB+ RAM available

## 🔧 Phase 1: Install Prerequisites

### 1.1 Install Docker
```bash
# macOS (with Homebrew)
brew install docker

# Alternative: Download Docker Desktop
# Visit: https://www.docker.com/products/docker-desktop
# Install and start Docker Desktop

# Verify installation
docker --version
docker ps  # Should not error
```

### 1.2 Install Node.js
```bash
# macOS (with Homebrew)
brew install node

# Alternative: Download from nodejs.org
# Visit: https://nodejs.org (Download LTS version)

# Verify installation
node --version  # Should show v18+ or v20+
npm --version
```

### 1.3 Install Ollama (AI Model Runtime)
```bash
# macOS
brew install ollama

# Alternative: Direct download
# Visit: https://ollama.ai
# Download and install

# Verify installation
ollama --version
```

## 🏗️ Phase 2: Project Setup

### 2.1 Clone Repository
```bash
# Clone the project
git clone https://github.com/vivekssharma13/helmAIDemo.git
cd helmAIDemo

# Alternative: Download ZIP
# Visit: https://github.com/vivekssharma13/helmAIDemo
# Click "Code" → "Download ZIP" → Extract

# Verify you're in the right directory
ls -la  # Should show package.json, src/, data/, etc.
```

### 2.2 Install Dependencies
```bash
# Install all Node.js dependencies
npm install

# If you see any errors, try:
npm install --legacy-peer-deps

# Verify installation
npm list  # Should show dependency tree
```

## 🚀 Phase 3: Infrastructure Startup

### 3.1 Start Docker Services
```bash
# Ensure Docker is running
docker info  # Should show Docker information

# Start ChromaDB (Vector Database)
docker run -d --name chroma-db -p 8000:8000 chromadb/chroma

# Verify ChromaDB is running
docker ps  # Should show chroma-db container
curl http://localhost:8000/api/v1  # Should return API info
```

### 3.2 Start Ollama and Download AI Model
```bash
# Start Ollama service (in background)
ollama serve &

# Wait 5 seconds for service to start
sleep 5

# Download Mistral AI model (this takes 5-10 minutes)
ollama pull mistral:latest

# Verify model is available
ollama list  # Should show mistral:latest
```

### 3.3 Start HelmAI System
```bash
# Start the complete HelmAI infrastructure
chmod +x start-helmai.js  # Make script executable
./start-helmai.js

# You should see:
# ✅ Docker is available
# ✅ Ollama is available
# ✅ Chroma DB container started
# ✅ Knowledge base created: 5 articles stored
# ✅ REST API server started successfully
```

**Expected Output:**
```
🎉 === HELMAI INFRASTRUCTURE READY ===
🌐 API Server: http://localhost:3001
🗄️  Chroma DB: http://localhost:8000

📡 Try the API:
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I book a flight?"}'
```

## 📚 Phase 4: Load Training Data

### 4.1 Import Airline Training Data
```bash
# Run the interactive import script
node scripts/quick-import.js

# When prompted:
# "Do you want to proceed with the import? (y/N):"
# Type: y
# Press: Enter
```

### 4.2 Monitor Import Progress
The import will process 420 training samples in batches:
```
📦 Processing batch 1/42 (10 articles)...
✅ Batch 1: Created 10 embeddings and stored in database
✅ Batch 1 completed. Progress: 10/420 (2%)

... (continues for all 42 batches)

🎉 Import completed!
✅ Successfully processed: 420 articles
❌ Errors encountered: 0
```

**Total time:** 15-20 minutes (depending on your hardware)

## 🧪 Phase 5: Test Everything

### 5.1 Quick Health Check
```bash
# Test if API is responding
curl http://localhost:3001/api/health

# Expected response:
# {"success":true,"status":"healthy","timestamp":"..."}
```

### 5.2 Test Search Functionality
```bash
# Test booking queries
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I book a flight?"}'

# Test cancellation queries
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "I need to cancel my reservation"}'

# Test baggage queries
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What can I bring in my carry-on?"}'
```

### 5.3 Test Category Search
```bash
# Test category-specific search
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{"query": "change my flight", "category": "changes"}'
```

### 5.4 Expected Search Response
```json
{
  "success": true,
  "query": "How do I book a flight?",
  "results": [
    {
      "intent": "flight_booking",
      "text": "I want to book a flight from New York to Los Angeles",
      "confidence": 89,
      "similarity": 0.894,
      "category": "booking"
    },
    {
      "intent": "flight_booking", 
      "text": "How do I purchase a ticket online?",
      "confidence": 87,
      "similarity": 0.871,
      "category": "booking"
    }
  ],
  "resultCount": 2,
  "timestamp": "2025-07-27T07:44:11.153Z"
}
```

## ✅ Phase 6: Verify Complete Setup

### 6.1 Run Comprehensive Test
```bash
# Run the database test script
node test-database.js

# Expected output:
# 🔍 Testing: "book a flight"
# Found 2 results:
# 1. [flight_booking] I'd like to make a flight reservation... (confidence: 89%)
# 2. [flight_booking] How do I purchase a ticket online?... (confidence: 87%)
```

### 6.2 Check System Statistics
```bash
# Get detailed system stats
curl http://localhost:3001/api/system/status

# Should show:
# - Model: mistral:latest
# - Collection: helmai-production  
# - Status: ready
# - Memory usage, uptime, etc.
```

### 6.3 Final Validation Checklist
- [ ] ChromaDB running on port 8000
- [ ] Ollama serving mistral:latest model
- [ ] HelmAI API running on port 3001
- [ ] 420 training samples imported
- [ ] Search queries returning relevant results
- [ ] Response times under 2 seconds

## 🔄 Daily Operations

### Starting the System
```bash
# Quick startup (if everything is already installed)
docker start chroma-db
ollama serve &
./start-helmai.js
```

### Stopping the System
```bash
# Stop all services
docker stop chroma-db
pkill -f ollama
pkill -f "node.*api"
```

### Restarting After Changes
```bash
# Restart just the API
pkill -f "node.*api"
node src/api/app.js
```

## 🚨 Troubleshooting Guide

### Problem: ChromaDB won't start
```bash
# Solution 1: Check if port is in use
lsof -i :8000
# Kill process if needed: kill -9 <PID>

# Solution 2: Remove and recreate container
docker stop chroma-db
docker rm chroma-db
docker run -d --name chroma-db -p 8000:8000 chromadb/chroma
```

### Problem: Ollama model not found
```bash
# Check if service is running
ps aux | grep ollama

# Restart Ollama
pkill ollama
ollama serve &

# Re-download model
ollama pull mistral:latest
```

### Problem: API port 3001 in use
```bash
# Find and kill process using port 3001
lsof -ti :3001 | xargs kill -9

# Restart HelmAI
./start-helmai.js
```

### Problem: Low search confidence scores
```bash
# Check if data was imported correctly
curl http://localhost:3001/api/system/status

# If needed, re-import training data
node scripts/quick-import.js
```

### Problem: Out of memory during import
```bash
# Reduce batch size
# Edit scripts/import-csv-knowledge-base.js
# Change: batchSize: 10 → batchSize: 5

# Then re-run import
node scripts/quick-import.js
```

## 📊 Performance Expectations

After successful deployment, you should see:

| Metric | Expected Value |
|--------|----------------|
| Search Response Time | < 2 seconds |
| Confidence Scores | 60-95% for relevant queries |
| Training Samples | 420 airline service queries |
| Memory Usage | ~500MB for API + 1GB for models |
| Disk Usage | ~8GB total (models + data) |

## 🎯 Next Steps

Once deployed successfully:

1. **Test with your own queries** to verify relevance
2. **Add more training data** for your specific use case
3. **Monitor performance** in production
4. **Scale horizontally** by running multiple API instances
5. **Implement authentication** for production use

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure ports 3001 and 8000 are available
4. Check system resources (RAM/disk space)
5. Review logs in the terminal output

**System is ready for production use with 420+ training samples and semantic search capabilities!** 🚀
