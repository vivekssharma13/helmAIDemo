# HelmAI REST API Documentation

## Quick Start

### 1. Start the API Server

```bash
# Option 1: Using npm script (recommended)
npm run api

# Option 2: Direct execution
node src/api/app.js

# Option 3: With custom port
PORT=3002 npm run api
```

The API will start on `http://localhost:3001` by default.

### 2. Test the API

```bash
# Health check
curl http://localhost:3001/api/health

# Search query
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I check in for my flight?"}'
```

## API Endpoints

### 🎯 Main Search Endpoint (Frontend Integration)

**POST** `/api/search`

This is the primary endpoint your frontend should call.

```javascript
// Request
{
  "query": "How do I check in for my flight?",
  "maxResults": 3,        // optional, default: 3
  "minSimilarity": 0.3    // optional, default: 0.3
}

// Response
{
  "success": true,
  "query": "How do I check in for my flight?",
  "results": [
    {
      "id": "check-in-001",
      "title": "Online Check-in Process",
      "content": "You can check in online...",
      "category": "check-in",
      "similarity": 0.87
    }
  ],
  "resultCount": 1,
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### Category Search

**POST** `/api/search/category`

Search within a specific category.

```javascript
// Request
{
  "query": "weight limit",
  "category": "baggage",
  "maxResults": 3
}
```

### Health Check

**GET** `/api/health`

Check if the API is running.

```javascript
// Response
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "version": "2.0.0",
  "system": "HelmAI Embedding API",
  "initialized": true,
  "model": "mistral:latest",
  "collection": "helmai-production"
}
```

### System Status

**GET** `/api/system/status`

Get detailed system information.

### Initialize System

**POST** `/api/system/initialize`

Manually initialize the system (usually auto-initialized).

## Frontend Integration

### React Example

```jsx
import React, { useState } from 'react';

function HelmAIChat() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    maxResults: 3
                })
            });

            const data = await response.json();
            if (data.success) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask HelmAI anything..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {results.map((result, index) => (
                <div key={index}>
                    <h3>{result.title}</h3>
                    <p>{result.content}</p>
                    <small>
                        {result.category} | {(result.similarity * 100).toFixed(1)}%
                    </small>
                </div>
            ))}
        </div>
    );
}
```

### Vanilla JavaScript Example

```javascript
async function searchHelmAI(userQuery) {
    try {
        const response = await fetch('http://localhost:3001/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: userQuery,
                maxResults: 3
            })
        });

        const data = await response.json();
        
        if (data.success) {
            return data.results;
        } else {
            console.error('Search failed:', data.error);
            return [];
        }
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

// Usage
const results = await searchHelmAI("How do I cancel my flight?");
console.log(results);
```

## Configuration

### Environment Variables

```bash
# Port (default: 3001)
PORT=3001

# Ollama model (default: mistral:latest)
OLLAMA_MODEL=mistral:latest

# Collection name (default: helmai-production)
COLLECTION_NAME=helmai-production
```

### CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)
- `http://localhost:8080` (Vue default)

## Error Handling

### Common Error Responses

```javascript
// Bad Request (400)
{
  "success": false,
  "error": "Query is required and must be a non-empty string"
}

// Internal Server Error (500)
{
  "success": false,
  "error": "Search failed",
  "message": "Vector database connection failed"
}

// Not Found (404)
{
  "success": false,
  "error": "Endpoint not found",
  "availableEndpoints": [
    "POST /api/search",
    "GET /api/health"
  ]
}
```

## Prerequisites

Before starting the API:

1. **Chroma DB** must be running:
   ```bash
   docker run -p 8000:8000 chromadb/chroma
   ```

2. **Ollama** must be running with a model:
   ```bash
   ollama serve
   ollama pull mistral:latest
   ```

3. **Dependencies** must be installed:
   ```bash
   npm install
   ```

## Complete Workflow

```bash
# 1. Start Chroma DB
docker run -p 8000:8000 chromadb/chroma

# 2. Start Ollama (in another terminal)
ollama serve

# 3. Install dependencies (if not done)
npm install

# 4. Start the API
npm run api

# 5. Test from your frontend
# The API will auto-initialize the knowledge base on first request
```

## Performance Notes

- First API call may take 10-30 seconds (system initialization)
- Subsequent calls are fast (< 1 second)
- The system automatically manages the vector database
- Knowledge base is persistent across restarts

## Troubleshooting

### API won't start
- Check if port 3001 is available
- Ensure Chroma DB is running on port 8000
- Verify Ollama is running and has the model

### Search returns no results
- Check if the knowledge base was created
- Verify Chroma DB connection
- Check API logs for initialization errors

### CORS errors from frontend
- Ensure your frontend URL is in the CORS configuration
- Check browser dev tools for specific CORS errors
