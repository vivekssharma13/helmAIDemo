/**
 * FRONTEND INTEGRATION EXAMPLES
 * 
 * This file shows how your frontend can call the HelmAI API.
 * Includes examples for React, vanilla JS, and fetch API usage.
 */

// =====================================================
// 1. BASIC FETCH API EXAMPLE (Vanilla JavaScript)
// =====================================================

/**
 * Basic search function using fetch API
 */
async function searchHelmAI(userQuery) {
    try {
        const response = await fetch('http://localhost:3001/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: userQuery,
                maxResults: 3,
                minSimilarity: 0.3
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Search Results:', data.results);
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

// =====================================================
// 2. REACT HOOK EXAMPLE
// =====================================================

/**
 * React hook for HelmAI integration
 */
function useHelmAISearch() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const search = async (query) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('http://localhost:3001/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    maxResults: 5,
                    minSimilarity: 0.3
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setResults(data.results);
            } else {
                setError(data.error);
                setResults([]);
            }
        } catch (err) {
            setError(err.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };
    
    return { results, loading, error, search };
}

// =====================================================
// 3. REACT COMPONENT EXAMPLE
// =====================================================

/**
 * React component using HelmAI search
 */
function HelmAISearchComponent() {
    const { results, loading, error, search } = useHelmAISearch();
    const [query, setQuery] = useState('');
    
    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            search(query.trim());
        }
    };
    
    return (
        <div className="helmai-search">
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask HelmAI anything..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading || !query.trim()}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>
            
            {error && (
                <div className="error">
                    Error: {error}
                </div>
            )}
            
            {results.length > 0 && (
                <div className="results">
                    <h3>Results:</h3>
                    {results.map((result, index) => (
                        <div key={index} className="result-item">
                            <h4>{result.title}</h4>
                            <p>{result.content}</p>
                            <small>
                                Category: {result.category} | 
                                Similarity: {(result.similarity * 100).toFixed(1)}%
                            </small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// =====================================================
// 4. AXIOS EXAMPLE (if you prefer axios)
// =====================================================

/**
 * Search function using axios
 */
async function searchWithAxios(userQuery) {
    try {
        const response = await axios.post('http://localhost:3001/api/search', {
            query: userQuery,
            maxResults: 3,
            minSimilarity: 0.3
        });
        
        if (response.data.success) {
            return response.data.results;
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        console.error('Axios Error:', error);
        throw error;
    }
}

// =====================================================
// 5. HEALTH CHECK FUNCTION
// =====================================================

/**
 * Check if HelmAI API is healthy
 */
async function checkAPIHealth() {
    try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        
        return {
            healthy: data.success && data.status === 'healthy',
            data: data
        };
    } catch (error) {
        return {
            healthy: false,
            error: error.message
        };
    }
}

// =====================================================
// 6. CATEGORY SEARCH EXAMPLE
// =====================================================

/**
 * Search within a specific category
 */
async function searchByCategory(query, category) {
    try {
        const response = await fetch('http://localhost:3001/api/search/category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                category: category,
                maxResults: 5
            })
        });
        
        const data = await response.json();
        return data.success ? data.results : [];
    } catch (error) {
        console.error('Category search error:', error);
        return [];
    }
}

// =====================================================
// 7. USAGE EXAMPLES
// =====================================================

// Example usage in your frontend:

/*
// Basic search
const results = await searchHelmAI("How do I check in for my flight?");

// Category search
const baggageResults = await searchByCategory("weight limit", "baggage");

// Health check
const { healthy } = await checkAPIHealth();
if (!healthy) {
    console.log("HelmAI API is not available");
}

// React component usage
<HelmAISearchComponent />
*/

module.exports = {
    searchHelmAI,
    useHelmAISearch,
    HelmAISearchComponent,
    searchWithAxios,
    checkAPIHealth,
    searchByCategory
};
