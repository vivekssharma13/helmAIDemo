# HelmAI Vector Embedding System 🛫

A production-ready semantic search and intent classification system for airline customer service, built with local AI models and vector databases.

## 🚀 Features

- **Semantic Search**: Find relevant answers using vector similarity
- **Intent Classification**: Automatically categorize customer queries
- **Local AI Models**: Uses Ollama (Mistral/Llama) - no API costs
- **Vector Database**: Scalable storage with Chroma DB
- **Production Ready**: Optimized for performance and reliability

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
