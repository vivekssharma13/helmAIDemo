# 🚀 HelmAI Quick Start Checklist

Use this checklist to deploy HelmAI in 30 minutes or less.

## ✅ Pre-flight Check (5 minutes)

### Prerequisites
- [ ] **Docker installed** → `docker --version` should work
- [ ] **Node.js installed** → `node --version` should show v18+
- [ ] **Ollama installed** → `ollama --version` should work
- [ ] **8GB+ RAM available**
- [ ] **10GB+ free disk space**
- [ ] **Internet connection** (for model download)

### Project Setup
- [ ] **Repository cloned** → `git clone https://github.com/vivekssharma13/helmAIDemo.git`
- [ ] **Dependencies installed** → `npm install`

## 🏗️ Infrastructure Setup (10 minutes)

### Start Services
- [ ] **Docker running** → Open Docker Desktop or `sudo systemctl start docker`
- [ ] **ChromaDB started** → `docker run -d --name chroma-db -p 8000:8000 chromadb/chroma`
- [ ] **Ollama service** → `ollama serve &`
- [ ] **Mistral model** → `ollama pull mistral:latest` (5-10 min download)

### Verify Services
- [ ] **ChromaDB responding** → `curl http://localhost:8000/api/v1`
- [ ] **Ollama responding** → `ollama list` shows mistral:latest

## 🚀 HelmAI Launch (5 minutes)

### Start System
- [ ] **HelmAI infrastructure** → `./start-helmai.js`
- [ ] **API responding** → Should show "API Server: http://localhost:3001"

### Quick Test
- [ ] **Health check** → `curl http://localhost:3001/api/health`
- [ ] **Basic search** → `curl -X POST http://localhost:3001/api/search -H "Content-Type: application/json" -d '{"query": "test"}'`

## 📚 Load Training Data (10 minutes)

### Import Data
- [ ] **Start import** → `node scripts/quick-import.js`
- [ ] **Confirm import** → Type `y` when prompted
- [ ] **Wait for completion** → All 42 batches processed (420 articles)

### Verify Import
- [ ] **Test search** → `curl -X POST http://localhost:3001/api/search -H "Content-Type: application/json" -d '{"query": "book a flight"}'`
- [ ] **Check results** → Should return flight_booking intents with 60-90% confidence

## 🧪 Final Validation

### Test All Endpoints
- [ ] **Main search** → `curl -X POST http://localhost:3001/api/search -H "Content-Type: application/json" -d '{"query": "How do I cancel?"}'`
- [ ] **Category search** → `curl -X POST http://localhost:3001/api/search/category -H "Content-Type: application/json" -d '{"query": "change flight", "category": "changes"}'`
- [ ] **System status** → `curl http://localhost:3001/api/system/status`

### Performance Check
- [ ] **Response time** → < 2 seconds per search
- [ ] **Confidence scores** → 60-95% for relevant queries
- [ ] **Memory usage** → ~1GB total (check with `docker stats`)

## 🎉 Success Criteria

✅ **All checkboxes above completed**  
✅ **API returning JSON responses**  
✅ **Search confidence scores 60%+**  
✅ **420 training samples loaded**  
✅ **Response times under 2 seconds**

## 🚨 Quick Troubleshooting

### If ChromaDB fails:
```bash
docker stop chroma-db && docker rm chroma-db
docker run -d --name chroma-db -p 8000:8000 chromadb/chroma
```

### If Ollama fails:
```bash
pkill ollama
ollama serve &
ollama pull mistral:latest
```

### If API port busy:
```bash
lsof -ti :3001 | xargs kill -9
./start-helmai.js
```

### If import fails:
```bash
# Reduce batch size and retry
# Edit scripts/import-csv-knowledge-base.js line 24: batchSize: 5
node scripts/quick-import.js
```

## 📖 More Help

- **Detailed guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Data guide**: See [data/README.md](data/README.md)  
- **Main docs**: See [README.md](README.md)

---

**Total estimated time: 30 minutes** ⏱️  
**System ready for production use!** 🚀
