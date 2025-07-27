/**
 * HelmAI Local Embedding Integration
 * This shows how to integrate local embeddings into your HelmAI project
 */

const { HelmAIEmbeddingService } = require('./local-embeddings');

/**
 * HelmAI Intent Classification using Local Embeddings
 */
class HelmAIIntentClassifier {
    constructor() {
        this.embeddingService = new HelmAIEmbeddingService();
        this.intentDatabase = this.initializeIntentDatabase();
    }

    /**
     * Initialize known intents and their examples
     */
    initializeIntentDatabase() {
        return [
            {
                intent: 'flight_booking',
                examples: [
                    'I want to book a flight to Dallas',
                    'Book me a ticket to New York',
                    'I need to reserve a flight',
                    'Can you help me find flights to Miami?'
                ],
                response: 'I can help you book a flight. Let me search for available options.'
            },
            {
                intent: 'flight_cancellation',
                examples: [
                    'I want to cancel my flight',
                    'Cancel my booking please',
                    'I need to cancel my reservation',
                    'Can I get a refund for my ticket?'
                ],
                response: 'I can help you cancel your flight. Let me pull up your booking details.'
            },
            {
                intent: 'baggage_issue',
                examples: [
                    'My baggage is lost',
                    'I can\'t find my luggage',
                    'My suitcase didn\'t arrive',
                    'Track my lost baggage'
                ],
                response: 'I\'m sorry about your baggage issue. Let me help you track it down.'
            },
            {
                intent: 'flight_status',
                examples: [
                    'What\'s the status of my flight?',
                    'Is flight AA123 on time?',
                    'Flight delay information',
                    'Check my flight status'
                ],
                response: 'Let me check the current status of your flight.'
            },
            {
                intent: 'crew_emergency',
                examples: [
                    'Emergency assistance needed',
                    'Crew member requesting immediate help',
                    'SOS button activated',
                    'Priority crew support required'
                ],
                response: 'Emergency protocol activated. Connecting you to priority support immediately.'
            }
        ];
    }

    /**
     * Classify user intent using local embeddings
     */
    async classifyIntent(userQuery) {
        console.log(`🎯 Classifying intent for: "${userQuery}"`);
        
        // Get all example texts from intent database
        const allExamples = [];
        const intentMap = [];
        
        this.intentDatabase.forEach((intentData) => {
            intentData.examples.forEach((example) => {
                allExamples.push(example);
                intentMap.push({
                    intent: intentData.intent,
                    response: intentData.response
                });
            });
        });
        
        // Find most similar intent example
        const result = await this.embeddingService.findMostSimilar(userQuery, allExamples);
        
        const matchedIntent = intentMap[result.mostSimilar.index];
        const confidence = result.mostSimilar.similarity;
        
        return {
            intent: matchedIntent.intent,
            confidence: confidence,
            response: matchedIntent.response,
            matchedExample: result.mostSimilar.text,
            allMatches: result.allSimilarities.slice(0, 3).map(item => ({
                example: item.text,
                intent: intentMap[item.index].intent,
                confidence: item.similarity
            }))
        };
    }

    /**
     * Smart routing for crew vs passenger
     */
    async routeQuery(userQuery, userType = 'passenger') {
        const classification = await this.classifyIntent(userQuery);
        
        // Special handling for crew emergencies
        if (userType === 'crew' && classification.intent === 'crew_emergency') {
            return {
                ...classification,
                priority: 'emergency',
                routing: 'immediate_escalation'
            };
        }
        
        // Regular passenger routing
        return {
            ...classification,
            priority: 'normal',
            routing: 'standard_flow'
        };
    }
}

/**
 * HelmAI Knowledge Base using Local Embeddings
 */
class HelmAIKnowledgeBase {
    constructor() {
        this.embeddingService = new HelmAIEmbeddingService();
        this.knowledgeArticles = this.initializeKnowledgeBase();
    }

    initializeKnowledgeBase() {
        return [
            {
                id: 'kb001',
                title: 'Flight Cancellation Process',
                content: 'To cancel your flight, you can do it online, through the app, or by calling customer service. Refund eligibility depends on your ticket type.',
                keywords: ['cancel', 'refund', 'cancellation', 'money back']
            },
            {
                id: 'kb002', 
                title: 'Baggage Tracking System',
                content: 'Use your baggage claim number to track lost luggage. We provide real-time updates and will deliver found bags to your address.',
                keywords: ['baggage', 'luggage', 'lost', 'tracking', 'claim']
            },
            {
                id: 'kb003',
                title: 'Flight Rebooking Options',
                content: 'You can rebook your flight for free within 24 hours of booking. After that, change fees may apply based on your fare type.',
                keywords: ['rebook', 'change', 'reschedule', 'date', 'time']
            }
        ];
    }

    /**
     * Search knowledge base using semantic similarity
     */
    async searchKnowledgeBase(query) {
        const articles = this.knowledgeArticles.map(article => 
            `${article.title}. ${article.content}`
        );
        
        const result = await this.embeddingService.findMostSimilar(query, articles);
        
        const matchedArticle = this.knowledgeArticles[result.mostSimilar.index];
        
        return {
            article: matchedArticle,
            relevanceScore: result.mostSimilar.similarity,
            allMatches: result.allSimilarities.slice(0, 3).map(item => ({
                article: this.knowledgeArticles[item.index],
                score: item.similarity
            }))
        };
    }
}

/**
 * Main HelmAI Demo using Local Embeddings
 */
async function helmAIDemo() {
    console.log('🚁 === HelmAI LOCAL EMBEDDING INTEGRATION ===\n');
    
    const intentClassifier = new HelmAIIntentClassifier();
    const knowledgeBase = new HelmAIKnowledgeBase();
    
    // Test different user queries
    const testQueries = [
        { query: "I lost my suitcase at the airport", type: "passenger" },
        { query: "Book me a flight to Seattle next week", type: "passenger" },
        { query: "Emergency! Need immediate assistance", type: "crew" },
        { query: "How do I cancel my reservation?", type: "passenger" }
    ];
    
    for (const test of testQueries) {
        console.log(`\n👤 ${test.type.toUpperCase()}: "${test.query}"`);
        console.log('─'.repeat(50));
        
        // Classify intent
        const classification = await intentClassifier.routeQuery(test.query, test.type);
        console.log(`🎯 Intent: ${classification.intent}`);
        console.log(`🔥 Confidence: ${(classification.confidence * 100).toFixed(1)}%`);
        console.log(`⚡ Priority: ${classification.priority}`);
        console.log(`🤖 Response: ${classification.response}`);
        
        if (classification.priority !== 'emergency') {
            // Search knowledge base for additional context
            const kbResult = await knowledgeBase.searchKnowledgeBase(test.query);
            console.log(`📚 Knowledge Base Match: ${kbResult.article.title}`);
            console.log(`📖 Content: ${kbResult.article.content.substring(0, 100)}...`);
        }
    }
    
    console.log('\n✅ HelmAI local embedding integration complete!');
    console.log('💡 Benefits of local embeddings:');
    console.log('   - No API costs');
    console.log('   - Full privacy (data never leaves your server)');
    console.log('   - Customizable models');
    console.log('   - Offline capability');
}

module.exports = {
    HelmAIIntentClassifier,
    HelmAIKnowledgeBase
};

// Run demo if called directly
if (require.main === module) {
    helmAIDemo();
}
