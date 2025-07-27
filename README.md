# HelmAI Vector Embedding System 🛫

A production-ready semantic search and intent classification system for airline customer service, built with local AI models and vector databases.

## 🚀 Features

- **Semantic Search**: Find relevant answers using vector similarity
- **Intent Classification**: Automatically categorize customer queries
- **Local AI Models**: Uses Ollama (Mistral/Llama) - no API costs
- **Vector Database**: Scalable storage with Chroma DB
- **Production Ready**: Optimized for performance and reliability

## 🚀 Quick Start - Complete Setup Guide

### Prerequisites (One-time setup)

1. **Install Docker**
   ```bash
   # macOS (with Homebrew)
   brew install docker
   
   # Or download from: https://www.docker.com/products/docker-desktop
   ```

2. **Install Node.js** (version 18+)
   ```bash
   # macOS (with Homebrew)
   brew install node
   
   # Or download from: https://nodejs.org
   ```

3. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from: https://ollama.ai
   ```

### Step-by-Step Deployment

#### Step 1: Clone and Setup Project
```bash
# Clone the repository
git clone https://github.com/vivekssharma13/helmAIDemo.git
cd helmAIDemo

# Install dependencies
npm install
```

#### Step 2: Start Infrastructure Services
```bash
# Start Docker (if not already running)
open -a Docker

# Pull and start ChromaDB (Vector Database)
docker run -d --name chroma-db -p 8000:8000 chromadb/chroma

# Start Ollama service
ollama serve &

# Pull the Mistral AI model (this may take a few minutes)
ollama pull mistral:latest

# Verify model is available
ollama list
```

#### Step 3: Start HelmAI System
```bash
# Start the complete HelmAI infrastructure
./start-helmai.js
```

This will:
- ✅ Check all prerequisites
- ✅ Start ChromaDB
- ✅ Verify Ollama is running
- ✅ Create initial knowledge base
- ✅ Start REST API on http://localhost:3001

#### Step 4: Load Training Data
```bash
# Import 420+ airline customer service training samples
node scripts/quick-import.js

# When prompted, type 'y' to proceed
```

This imports comprehensive training data with:
- 420 airline customer service queries
- 15+ intent categories
- High-quality embeddings for semantic search

#### Step 5: Test the System

**Test Search API:**
```bash
# Basic search test
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I book a flight?"}'

# Category-specific search
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{"query": "cancel my ticket", "category": "cancellation"}'

# Check system health
curl http://localhost:3001/api/health

# Get system statistics
curl http://localhost:3001/api/system/status
```

**Expected Response:**
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
    }
  ],
  "resultCount": 3,
  "timestamp": "2025-07-27T07:44:11.153Z"
}
```

#### Step 6: Production Deployment (Optional)

**For production deployment:**
```bash
# Set environment variables
export HELM_AI_PORT=3001
export CHROMA_DB_URL=http://localhost:8000
export OLLAMA_URL=http://localhost:11434

# Start in production mode
NODE_ENV=production node src/api/app.js
```

### 🔧 Available API Endpoints

Once the system is running, these endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | POST | Main semantic search |
| `/api/search/category` | POST | Category-specific search |
| `/api/health` | GET | System health check |
| `/api/system/status` | GET | Detailed system status |
| `/api/knowledge-base/stats` | GET | Knowledge base statistics |

### ⚡ Quick Commands Reference

```bash
# Start everything from scratch
./start-helmai.js && node scripts/quick-import.js

# Stop all services
docker stop chroma-db
pkill -f ollama

# Restart just the API
node src/api/app.js

# Test search functionality
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your test query here"}'
```

### 🚨 Troubleshooting

**If ChromaDB fails to start:**
```bash
docker stop chroma-db
docker rm chroma-db
docker run -d --name chroma-db -p 8000:8000 chromadb/chroma
```

**If Ollama model not found:**
```bash
ollama pull mistral:latest
ollama list  # Verify it's there
```

**If port 3001 is in use:**
```bash
lsof -ti :3001 | xargs kill -9
./start-helmai.js
```

### 📊 System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **CPU**: Modern multi-core processor
- **Network**: Internet connection for initial model download

The system will be ready for production use with 420+ training samples and sub-second search response times!

## 📖 Complete Documentation

For detailed deployment instructions and troubleshooting:

### 📚 Available Guides
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete step-by-step deployment guide with troubleshooting
- **[data/README.md](data/README.md)** - Training data documentation and import guide

### 🚀 Choose Your Path
- **Quick Setup**: Follow the steps above for rapid deployment
- **Detailed Setup**: Use [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive instructions
- **Data Management**: See [data/README.md](data/README.md) for import options and data formats

### 💡 Key Features
✅ **420+ Training Samples** - Comprehensive airline customer service dataset  
✅ **15+ Intent Categories** - Booking, cancellation, status, baggage, etc.  
✅ **Sub-second Search** - High-performance semantic search  
✅ **Local AI Models** - No API costs, complete privacy  
✅ **Production Ready** - Scalable architecture with Docker

## 📁 Project Structure

```
hackathon-ai/
├── 📦 src/                          # Production code
│   ├── 🔧 core/                     # Core embedding system
│   │   ├── vector-database.js       # Chroma DB integration
│   │   └── embedding-creator.js     # Embedding generation
│   └── 🛠️ services/                 # Business logic services
│       ├── embedding-searcher.js    # Search functionality
│       └── helmai-embeddings.js     # HelmAI integration
├── 📚 examples/                     # Examples and demos
│   ├── demos/                       # Working demonstrations
│   │   └── vector-integration-demo.js
│   └── learning/                    # Educational examples
│       ├── index.js                 # Simple embedding concepts
│       ├── production-embeddings.js # Real-world examples
│       └── local-embeddings.js      # Local AI setup
├── � diagnostics/                  # Debugging and testing
│   ├── debug-embeddings.js          # Similarity testing & comparison
│   └── cosine-diagnosis.js          # Distance calculation debugging
├── 🛠️ maintenance/                  # Database maintenance
│   └── cleanup-collections.js       # Reset vector database
├── 📊 data/                         # Data storage
│   ├── prompts/                     # AI prompts
│   └── embeddings-storage/          # Legacy file storage
├── 📁 legacy/                       # Old implementations
│   └── (previous versions)          # Backup and reference files
├── 🚀 helmai-system.js              # Main entry point
└── 📖 README.md                     # This file
```

## 🛠️ Core Components

### Production Files (Essential for Hackathon)

#### 🔧 `src/core/`
- **`vector-database.js`** - Vector database operations with Chroma DB
- **`embedding-creator.js`** - Creates and stores embeddings

#### 🛠️ `src/services/`
- **`embedding-searcher.js`** - Search and retrieval service
- **`helmai-embeddings.js`** - HelmAI-specific implementations

#### 🚀 `helmai-system.js`
- **Main entry point** - Complete system integration
- **CLI interface** - Easy testing and demonstration

### Example Files (For Learning & Testing)

#### 📚 `examples/demos/`
- **`vector-integration-demo.js`** - Complete workflow demonstration

#### 📚 `examples/learning/`
- **`index.js`** - Simple embedding concepts (educational)
- **`production-embeddings.js`** - Real-world embedding patterns
- **`local-embeddings.js`** - Local AI model setup

### Diagnostic Files (For Debugging & Analysis)

#### � `diagnostics/`
- **`debug-embeddings.js`** - Test similarity calculations, compare manual vs Chroma DB
- **`cosine-diagnosis.js`** - Debug distance metrics and vector calculations

### Maintenance Files (For Database Management)

#### 🛠️ `maintenance/`
- **`cleanup-collections.js`** - Reset vector database, delete collections

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install Ollama
brew install ollama

# Start Ollama service
ollama serve

# Pull AI model
ollama pull mistral:latest

# Start Chroma DB (Docker)
docker run -p 8000:8000 chromadb/chroma
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the System
```bash
# Complete demo with knowledge base creation and search
node helmai-system.js

# Or test vector database integration
node examples/demos/vector-integration-demo.js
```

## 🎯 Usage Examples

### Basic Usage
```javascript
const { HelmAIEmbeddingSystem } = require('./helmai-system');

const system = new HelmAIEmbeddingSystem({
    model: 'mistral:latest',
    collectionName: 'my-airline-kb'
});

// Create knowledge base
await system.createKnowledgeBase(knowledgeBase);

// Search for answers
const answers = await system.searchForAnswer('How do I book a flight?');
```

### Advanced Usage
```javascript
const { HelmAIVectorDB } = require('./src/core/vector-database');

const vectorDB = new HelmAIVectorDB({
    model: 'mistral:latest',
    collectionName: 'production-kb'
});

// Category-specific search
const results = await vectorDB.searchByCategory('lost luggage', 'baggage', 3);
```

## 📊 Data Flow

```
Customer Query → Vector Embedding → Similarity Search → Intent Classification → Response
      ↓              ↓                    ↓                     ↓              ↓
"Book flight"   [0.1, 0.8, ...]    Chroma DB Search     "flight_booking"   Relevant Answer
```

## 🔧 Configuration

### Environment Setup
- **Ollama URL**: `http://localhost:11434` (default)
- **Chroma DB URL**: `http://localhost:8000` (default)
- **AI Model**: `mistral:latest` or `llama3.2:latest`

### Vector Database Settings
- **Distance Metric**: Cosine similarity
- **Embedding Dimensions**: 4096 (Mistral/Llama)
- **HNSW Parameters**: Optimized for accuracy

## 🧪 Testing & Debugging

### Test Similarity Calculations
```bash
npm run debug
```

### Diagnose Distance Issues
```bash
npm run diagnose
```

### Clean Database
```bash
npm run clean
```

## 🚀 Deployment

### For Hackathon Demo
1. Use `helmai-system.js` as main entry point
2. Ensure Ollama and Chroma DB are running
3. Run knowledge base creation once
4. Demo real-time search capabilities

### For Production
1. Scale Chroma DB with persistent storage
2. Implement caching for frequently asked questions
3. Add monitoring and logging
4. Set up proper error handling

## 🎓 Learning Path

1. **Start with**: `examples/learning/index.js` (basic concepts)
2. **Understand**: `src/core/vector-database.js` (database operations)
3. **Explore**: `examples/demos/vector-integration-demo.js` (complete workflow)
4. **Implement**: Your own knowledge base using `helmai-system.js`

## 🐛 Troubleshooting

### Common Issues
- **Large distances (>100,000)**: Run `utils/cleanup-collections.js`
- **No similarity results**: Check if Ollama is running
- **Chroma DB errors**: Ensure Docker container is running on port 8000

### Debug Commands
```bash
# Check Ollama status
ollama list

# Check Chroma DB
curl http://localhost:8000/api/v1/heartbeat

# Test embeddings
node utils/debug-embeddings.js
```

## 📈 Performance

- **Embedding Generation**: ~500ms per text (local)
- **Vector Search**: <50ms for 1000+ documents
- **Storage**: Scalable to millions of documents
- **Memory**: Optimized with HNSW indexing

## 🤝 Contributing

1. **Production code**: Add to `src/`
2. **Examples**: Add to `examples/`
3. **Utilities**: Add to `utils/`
4. **Update this README** when adding new features

## 📝 License

MIT License - Built for HelmAI Hackathon 2025

---

**Happy Hacking! 🚀** Build amazing AI-powered customer service with semantic search!
