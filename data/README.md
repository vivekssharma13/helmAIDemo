# HelmAI Knowledge Base CSV Training Data

This directory contains CSV training data and scripts for importing airline customer service data into the HelmAI vector database.

## 📁 Files Overview

### Data Files
- `airline-training-data.csv` - Main training dataset with 420+ airline customer service queries
- `helmai-knowledge-base.json` - Existing knowledge base (if any)
- `intent-extractor.txt` - Intent extraction prompts

### Scripts
- `scripts/import-csv-knowledge-base.js` - Main import script with full configuration
- `scripts/quick-import.js` - Simple interactive import script  
- `scripts/analyze-training-data.js` - Data analysis and quality check
- `scripts/clean-csv.js` - CSV data cleaner (if needed)

## 📊 Training Data Statistics

- **Total Records**: 420 airline customer service queries
- **Intent Categories**: 15+ different intents
- **Main Categories**:
  - Flight Booking (40 samples)
  - Flight Changes (40 samples) 
  - Flight Status (40 samples)
  - Flight Cancellation (39 samples)
  - Check-in (39 samples)
  - Baggage Inquiries (39 samples)
  - And 9 more categories...

- **Priority Distribution**:
  - High Priority: 137 samples (33%)
  - Medium Priority: 247 samples (59%)
  - Low Priority: 24 samples (6%)

## 🚀 Quick Start

### Prerequisites
```bash
# 1. Start ChromaDB
docker run -d --name chroma-db -p 8000:8000 chromadb/chroma

# 2. Ensure Ollama is running with Mistral model
ollama list  # Should show mistral:latest

# 3. Make sure HelmAI API is running (optional)
node src/api/app.js
```

### Import Data

#### Option 1: Interactive Import (Recommended)
```bash
node scripts/quick-import.js
```

#### Option 2: Direct Import
```bash
node scripts/import-csv-knowledge-base.js
```

#### Option 3: Custom Configuration
```bash
node scripts/import-csv-knowledge-base.js \
  --csv=./data/airline-training-data.csv \
  --batch-size=5 \
  --model=mistral:latest \
  --no-backup
```

### Analyze Data (Before Import)
```bash
node scripts/analyze-training-data.js
```

## 📋 CSV Format

The CSV file follows this structure:

```csv
id,text,intent,category,priority
booking_001,"I want to book a flight from NYC to LA",flight_booking,booking,high
cancel_001,"I need to cancel my flight",flight_cancellation,cancellation,high
```

### Fields:
- **id**: Unique identifier for each training sample
- **text**: The user query/statement
- **intent**: Intent classification (e.g., flight_booking, cancellation)
- **category**: Broader category (e.g., booking, support)
- **priority**: Priority level (high, medium, low)

## 🎯 Intent Categories

1. **flight_booking** - Booking new flights
2. **flight_cancellation** - Canceling existing bookings
3. **flight_change** - Modifying existing bookings
4. **flight_checkin** - Check-in related queries
5. **flight_status** - Flight status and delays
6. **baggage_inquiry** - Baggage policies and issues
7. **seat_selection** - Seat selection and preferences
8. **payment_inquiry** - Payment methods and issues
9. **special_assistance** - Accessibility and special needs
10. **connecting_flights** - Connection and layover queries
11. **loyalty_program** - Frequent flyer programs
12. **travel_documents** - Passport, visa, and ID requirements
13. **weather_related** - Weather delays and policies
14. **pricing_inquiry** - Fare information and discounts
15. **general_inquiry** - General customer service

## 🔧 Script Configuration

### Import Script Options

```javascript
const CONFIG = {
    csvPath: './data/airline-training-data.csv',
    batchSize: 10,                    // Process N articles at a time
    model: 'mistral:latest',          // Your local Mistral model
    collection: 'helmai-production',  // Target collection
    validateData: true,               // Validate before processing
    logProgress: true,                // Show progress
    createBackup: true                // Create backup
};
```

### Command Line Options

- `--csv=path` - Specify CSV file path
- `--batch-size=N` - Set batch processing size
- `--model=name` - Specify AI model to use
- `--no-backup` - Skip backup creation
- `--no-validation` - Skip data validation
- `--quiet` - Reduce logging output

## 📈 Performance Notes

- **Batch Size**: Recommended 5-10 for Mistral model
- **Processing Time**: ~2-3 seconds per article (including embedding generation)
- **Memory Usage**: Scales with batch size
- **Total Import Time**: ~15-20 minutes for 420 articles

## 🧪 Testing After Import

### Test Search Functionality
```bash
# Basic search test
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "how to book a flight"}'

# Category search test  
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{"query": "cancel ticket", "category": "cancellation"}'

# Get knowledge base stats
curl http://localhost:3001/api/knowledge-base/stats?detailed=true
```

### Expected Results
After successful import, you should see:
- **420+ articles** in the knowledge base
- **Search confidence scores** of 60-80% for relevant queries
- **Sub-second response times** for most searches
- **Proper intent classification** in search results

## 🔍 Data Quality

The training data has been validated for:
- ✅ **No empty texts or intents**
- ✅ **No duplicate entries**
- ✅ **Balanced intent distribution**
- ✅ **Consistent formatting**
- ✅ **Appropriate text lengths** (17-55 characters)

## 🚨 Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**
   ```bash
   # Check if ChromaDB is running
   curl http://localhost:8000/api/v1
   # Restart if needed
   docker restart chroma-db
   ```

2. **Ollama Model Not Found**
   ```bash
   # Check available models
   ollama list
   # Pull Mistral if missing
   ollama pull mistral:latest
   ```

3. **CSV Parsing Errors**
   ```bash
   # Clean CSV data
   node scripts/clean-csv.js
   # Then use the cleaned file
   ```

4. **Memory Issues**
   ```bash
   # Reduce batch size
   node scripts/import-csv-knowledge-base.js --batch-size=3
   ```

## 📝 Adding New Data

To add new training data:

1. **Edit the CSV file** with new entries
2. **Follow the existing format** exactly
3. **Run analysis** to check data quality
4. **Import incrementally** or replace existing data

### Sample New Entry
```csv
booking_041,"I want to book a last-minute emergency flight",flight_booking,booking,high
```

## 🎯 Next Steps

After successful import:

1. **Test search functionality** with various queries
2. **Monitor search performance** and confidence scores
3. **Add more training data** for underrepresented intents
4. **Fine-tune search parameters** based on results
5. **Implement feedback loops** to improve data quality

## 📊 Monitoring

Use these commands to monitor your knowledge base:

```bash
# Check system health
curl http://localhost:3001/api/health

# Get detailed statistics
curl http://localhost:3001/api/knowledge-base/stats?detailed=true

# Monitor search performance
curl http://localhost:3001/api/system/status
```

---

**Note**: This training data is designed for airline customer service use cases. Modify the intents and categories as needed for your specific domain.
