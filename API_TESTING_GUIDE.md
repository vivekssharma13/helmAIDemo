# HelmAI API Testing Guide

Complete guide with curl commands and Postman-ready requests for all HelmAI API endpoints.

## 🎯 Base URL
```
http://localhost:3001
```

## 📡 API Endpoints Reference

### 1. Health Check

**GET** `/api/health`

Basic health check to verify API is running.

```bash
curl -X GET http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-07-27T06:00:00.000Z",
  "version": "2.0.0",
  "system": "HelmAI Embedding API",
  "initialized": true,
  "model": "mistral:latest",
  "collection": "helmai-production"
}
```

---

### 2. Search for Answers (Main Endpoint)

**POST** `/api/search`

Primary search endpoint that your frontend will use.

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do I book a flight?",
    "maxResults": 3,
    "minSimilarity": 0.3
  }'
```

**Parameters:**
- `query` (required): Search query string
- `maxResults` (optional): Maximum number of results (default: 3)
- `minSimilarity` (optional): Minimum similarity threshold (default: 0.3)

**Expected Response:**
```json
{
  "success": true,
  "query": "How do I book a flight?",
  "results": [
    {
      "intent": "flight_booking",
      "text": "To book a flight, visit our website...",
      "confidence": 64,
      "similarity": 0.63590193,
      "category": "booking"
    }
  ],
  "resultCount": 1,
  "timestamp": "2025-07-27T06:00:00.000Z"
}
```

**More Examples:**
```bash
# Search for cancellation
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "I want to cancel my ticket"}'

# Search with high similarity threshold
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "baggage lost",
    "maxResults": 5,
    "minSimilarity": 0.5
  }'

# Search for check-in information
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "How to check in online"}'
```

---

### 3. Category Search

**POST** `/api/search/category`

Search within a specific category.

```bash
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{
    "query": "weight limit",
    "category": "baggage",
    "maxResults": 3
  }'
```

**Parameters:**
- `query` (required): Search query
- `category` (required): Category to search within
- `maxResults` (optional): Maximum results (default: 3)

**More Examples:**
```bash
# Search in booking category
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{
    "query": "payment methods",
    "category": "booking"
  }'

# Search in cancellation category
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{
    "query": "refund policy",
    "category": "cancellation"
  }'
```

---

### 4. System Status

**GET** `/api/system/status`

Get detailed system status including uptime and memory usage.

```bash
curl -X GET http://localhost:3001/api/system/status
```

**Expected Response:**
```json
{
  "success": true,
  "status": "ready",
  "stats": {
    "model": "mistral:latest",
    "collection": "helmai-production",
    "status": "ready"
  },
  "uptime": 218.11364975,
  "memory": {
    "rss": 47677440,
    "heapTotal": 16252928,
    "heapUsed": 13125328,
    "external": 4213838,
    "arrayBuffers": 736943
  },
  "timestamp": "2025-07-27T06:00:00.000Z"
}
```

---

### 5. Knowledge Base Stats (Enhanced)

**GET** `/api/knowledge-base/stats`

Get comprehensive statistics with optional filtering.

#### Basic Stats
```bash
curl -X GET http://localhost:3001/api/knowledge-base/stats
```

#### Detailed Stats (All Information)
```bash
curl -X GET "http://localhost:3001/api/knowledge-base/stats?detailed=true"
```

#### Performance Only
```bash
curl -X GET "http://localhost:3001/api/knowledge-base/stats?performance=true&health=false&recommendations=false"
```

#### Health Status Only
```bash
curl -X GET "http://localhost:3001/api/knowledge-base/stats?health=true&performance=false&recommendations=false"
```

#### Summary Format
```bash
curl -X GET "http://localhost:3001/api/knowledge-base/stats?format=summary"
```

**Query Parameters:**
- `detailed=true` : Include all detailed metrics and API info
- `performance=true/false` : Include/exclude performance metrics
- `health=true/false` : Include/exclude health status
- `recommendations=true/false` : Include/exclude recommendations
- `format=summary` : Return condensed summary format

**Expected Response (Detailed):**
```json
{
  "success": true,
  "stats": {
    "model": "mistral:latest",
    "collection": "helmai-production",
    "status": "ready",
    "timestamp": "2025-07-27T06:00:00.000Z",
    "knowledgeBase": {
      "articleCount": 3,
      "exists": true,
      "lastUpdated": "2025-07-27T05:49:01.695Z",
      "approximateSize": "3KB"
    },
    "performance": {
      "search": {
        "totalSearches": 5,
        "averageResponseTime": 245,
        "fastestSearch": 180,
        "slowestSearch": 320,
        "successRate": 100,
        "lastSearchTime": "2025-07-27T05:49:19.125Z"
      },
      "uptime": "15 minutes",
      "responseTime": {
        "fastest": "180ms",
        "slowest": "320ms",
        "average": "245ms"
      }
    },
    "system": {
      "memoryUsage": {
        "rss": 45,
        "heapTotal": 15,
        "heapUsed": 12,
        "external": 4
      },
      "nodeVersion": "v18.17.0",
      "platform": "darwin",
      "cpuTime": {
        "user": "150ms",
        "system": "45ms"
      }
    },
    "health": {
      "vectorDatabase": "healthy",
      "searchCapability": "ready",
      "memoryStatus": "good",
      "overallStatus": "healthy"
    },
    "computed": {
      "articlesPerMB": 0.25,
      "searchEfficiency": 4,
      "memoryEfficiency": 80
    },
    "recommendations": [
      "System is running optimally"
    ]
  },
  "timestamp": "2025-07-27T06:00:00.000Z"
}
```

**Expected Response (Summary):**
```json
{
  "success": true,
  "summary": {
    "model": "mistral:latest",
    "collection": "helmai-production",
    "status": "ready",
    "articleCount": 3,
    "overallHealth": "healthy",
    "uptime": "15 minutes",
    "memoryUsed": "12MB",
    "searchCount": 5,
    "avgResponseTime": "245ms"
  },
  "timestamp": "2025-07-27T06:00:00.000Z"
}
```

---

### 6. Create Knowledge Base

**POST** `/api/knowledge-base/create`

Create or update the knowledge base with new articles.

```bash
curl -X POST http://localhost:3001/api/knowledge-base/create \
  -H "Content-Type: application/json" \
  -d '{
    "knowledgeBase": [
      {
        "id": "booking_001",
        "text": "To book a flight, visit our website, select your departure and destination cities, choose travel dates, and complete payment.",
        "intent": "flight_booking",
        "metadata": {
          "category": "booking",
          "priority": "high"
        }
      },
      {
        "id": "cancel_001",
        "text": "Flight cancellations are free within 24 hours of booking. After 24 hours, cancellation fees may apply based on your ticket type.",
        "intent": "flight_cancellation",
        "metadata": {
          "category": "cancellation",
          "priority": "high"
        }
      }
    ]
  }'
```

**Parameters:**
- `knowledgeBase` (required): Array of article objects
  - `id`: Unique identifier
  - `text`: Article content
  - `intent`: Intent classification
  - `metadata`: Additional metadata (category, priority, etc.)

---

### 7. Initialize System

**POST** `/api/system/initialize`

Manually initialize the system (usually happens automatically).

```bash
curl -X POST http://localhost:3001/api/system/initialize \
  -H "Content-Type: application/json"
```

---

## 🔧 Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "timestamp": "2025-07-27T06:00:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Endpoint not found
- `500` - Internal Server Error

---

## 📋 Postman Collection

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3001",
  "apiKey": "none_required"
}
```

### Pre-request Script (Global)
```javascript
// Set timestamp for requests
pm.globals.set("timestamp", new Date().toISOString());
```

### Test Scripts (Global)
```javascript
// Verify response structure
pm.test("Response has success field", function () {
    pm.expect(pm.response.json()).to.have.property('success');
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

pm.test("Response status is successful", function () {
    pm.response.to.have.status(200);
});
```

---

## 🚀 Quick Test Sequence

Run these commands in order to test the full API:

```bash
# 1. Check health
curl http://localhost:3001/api/health

# 2. Get system status
curl http://localhost:3001/api/system/status

# 3. Create knowledge base
curl -X POST http://localhost:3001/api/knowledge-base/create \
  -H "Content-Type: application/json" \
  -d '{"knowledgeBase": [{"id": "test_001", "text": "Test article", "intent": "test", "metadata": {"category": "test"}}]}'

# 4. Get detailed stats
curl "http://localhost:3001/api/knowledge-base/stats?detailed=true"

# 5. Search test
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# 6. Category search test
curl -X POST http://localhost:3001/api/search/category \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "category": "test"}'
```

---

## 📊 Stats API Usage Examples

### Monitor System Health
```bash
# Quick health check
curl "http://localhost:3001/api/knowledge-base/stats?format=summary"

# Full health report
curl "http://localhost:3001/api/knowledge-base/stats?health=true&recommendations=true"
```

### Performance Monitoring
```bash
# Performance metrics only
curl "http://localhost:3001/api/knowledge-base/stats?performance=true&health=false"

# Detailed performance with system info
curl "http://localhost:3001/api/knowledge-base/stats?detailed=true"
```

### Knowledge Base Information
```bash
# Basic knowledge base info
curl "http://localhost:3001/api/knowledge-base/stats?performance=false&health=false&recommendations=false"
```

This comprehensive guide covers all API endpoints with real examples you can copy-paste into Postman or use directly with curl! 🎯
