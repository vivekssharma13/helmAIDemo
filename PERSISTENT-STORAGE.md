# 🗄️ Persistent Data Storage Guide

This guide explains how to maintain your ChromaDB data permanently across restarts.

## 🎯 Problem Solved

Previously, every time you restarted ChromaDB, you had to re-import all 420 articles. Now the data persists automatically!

## 🔧 How It Works

### **Docker Volume Persistence**
- ChromaDB data is stored in `./data/chromadb-data/` on your local machine
- This folder is mounted into the Docker container as a volume
- When ChromaDB restarts, it finds all your existing data

### **Automatic Data Detection**
- The startup script checks if data already exists
- If found, it skips the initial knowledge base creation
- Your 420 articles remain available immediately

## 🚀 Usage Instructions

### **First Time Setup**
1. **Start the infrastructure:**
   ```bash
   npm run launch
   ```

2. **Load your full dataset (one time only):**
   ```bash
   npm run import-csv
   ```
   This imports all 420 airline service articles.

### **Daily Usage**
Just start the system:
```bash
npm run launch
```
Your data will be there automatically!

## 📁 Data Storage Location

```
data/
├── chromadb-data/           # Persistent ChromaDB storage
│   ├── chroma.sqlite3       # Database file
│   └── index/               # Vector indices
├── airline-training-data.csv # Source data
└── backup-*.json           # Import backups
```

## 🛠️ Alternative: Docker Compose

For even easier management, use Docker Compose:

### **Start ChromaDB:**
```bash
docker-compose up -d chromadb
```

### **Stop ChromaDB:**
```bash
docker-compose down
```

### **View logs:**
```bash
docker-compose logs chromadb
```

## ✅ Verification

### **Check if data persists:**
1. Start the system: `npm run launch`
2. Stop the system: `Ctrl+C`
3. Restart: `npm run launch`
4. Your data should still be there!

### **Check data count:**
Visit your API health endpoint:
```bash
curl http://localhost:3001/api/system/status
```

## 🔍 Troubleshooting

### **Data not persisting?**
1. Check that `./data/chromadb-data/` exists
2. Verify Docker has permission to write to the folder
3. Ensure the container uses the volume mount

### **Import issues?**
1. Make sure ChromaDB is running first
2. Run the import script separately: `npm run import-csv`

### **Start fresh?**
```bash
# Stop container
docker stop helmai-chroma

# Remove old data
rm -rf ./data/chromadb-data

# Restart
npm run launch
npm run import-csv
```

## 📊 Data Management Commands

```bash
# Import full dataset
npm run import-csv

# Alternative import commands
npm run load-data

# Custom import with options
node scripts/import-csv-knowledge-base.js --batch-size=20

# Import different CSV file
node scripts/import-csv-knowledge-base.js --csv=./data/my-data.csv
```

## 🎉 Benefits

✅ **No more re-importing data**
✅ **Instant startup with existing data**
✅ **Production-ready persistence**
✅ **Easy backup and restore**
✅ **Docker volume portability**

Your HelmAI system now maintains all data permanently across restarts!
