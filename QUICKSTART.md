# HelmAI Infrastructure Quick Start

## 🚀 **One-Command Startup**

Start the entire HelmAI infrastructure with a single command:

```bash
# Start everything (Docker, Ollama, Models, API)
npm run launch

# Or directly
node start-helmai.js
```

This script automatically:
1. ✅ **Starts Chroma DB** (Docker container)
2. ✅ **Starts Ollama** service
3. ✅ **Downloads AI models** (Mistral)
4. ✅ **Initializes knowledge base**
5. ✅ **Starts REST API** server
6. ✅ **Handles graceful shutdown**

## 📋 **Prerequisites**

Make sure you have:
- **Docker** installed and running
- **Node.js** installed
- **Ollama** installed (optional - script will try to start it)

### Install Ollama (if needed):
```bash
# macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Or visit: https://ollama.ai/download
```

## 🎯 **Usage**

### **Start Everything**
```bash
npm run launch
```

### **What You'll See**
```
🚀 === HELMAI INFRASTRUCTURE STARTUP ===

🔍 Checking prerequisites...
✅ Docker is available
✅ Ollama is available

🗄️  Starting Chroma DB...
📥 Pulling Chroma DB image...
✅ Chroma DB container started
⏳ Waiting for Chroma DB to be ready...
✅ Chroma DB is ready!

🤖 Starting Ollama...
✅ Ollama is already running

📚 Checking AI models...
✅ Model mistral:latest is available

⏳ Final service checks...
✅ Chroma DB confirmed ready
✅ Ollama confirmed ready

📚 Initializing knowledge base...
✅ Knowledge base initialized

🌐 Starting REST API server...
✅ REST API server started successfully

🎉 === HELMAI INFRASTRUCTURE READY ===
🌐 API Server: http://localhost:3001
🗄️  Chroma DB: http://localhost:8000

📡 Try the API:
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I book a flight?"}'

🛑 Press Ctrl+C to stop all services
```

### **Stop Everything**
Just press `Ctrl+C` - the script handles graceful shutdown of all services.

## 🔧 **What Gets Started**

| Service | Port | Purpose |
|---------|------|---------|
| **Chroma DB** | 8000 | Vector database |
| **Ollama** | 11434 | AI model service |
| **HelmAI API** | 3001 | REST endpoints |

## 🎮 **Test the Setup**

Once started, test your API:

```bash
# Health check
curl http://localhost:3001/api/health

# Search query
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I cancel my flight?"}'
```

## 🛠️ **Troubleshooting**

### **Docker Issues**
```bash
# Make sure Docker is running
docker --version

# If permission issues on Linux
sudo usermod -aG docker $USER
```

### **Port Conflicts**
If ports are already in use, the script will try to clean up and restart.

### **Ollama Issues**
```bash
# Install Ollama manually
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama manually
ollama serve

# Pull the model manually
ollama pull mistral:latest
```

### **Manual Cleanup**
If something goes wrong:
```bash
# Stop Docker containers
docker stop helmai-chroma
docker rm helmai-chroma

# Kill processes
pkill ollama
pkill node
```

## 📝 **Script Features**

- **🔄 Automatic retries** for service startup
- **⏱️ Smart waiting** for services to be ready
- **🧹 Graceful shutdown** when you press Ctrl+C
- **📊 Health checks** to verify everything is working
- **🚨 Error handling** with helpful messages
- **📁 Knowledge base** automatically initialized

## 🚀 **For Development**

The startup script is perfect for:
- **Hackathon demos**
- **Development environment**
- **Testing the full stack**
- **Showing the system to others**

Just run `npm run launch` and everything is ready! 🎯
