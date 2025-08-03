#!/usr/bin/env node

/**
 * Flight Booking Extraction API Test Suite
 * 
 * This script tests the /api/booking/extract endpoint with various user queries
 * to validate the information extraction and TTS response quality.
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/booking/extract';

// Test cases with different scenarios
const testCases = [
    {
        name: "Complete booking request",
        query: "Book me a round trip flight from New York to London departing December 15th returning December 22nd for 2 adults in business class"
    },
    {
        name: "Minimal booking request",
        query: "book me a flight"
    },
    {
        name: "Partial information - destination only",
        query: "I need a flight to Paris next week"
    },
    {
        name: "One-way with partial info",
        query: "I want a one-way ticket to Tokyo from San Francisco"
    },
    {
        name: "Family booking",
        query: "Book flights for 2 adults and 3 children to Disney World"
    },
    {
        name: "Business travel",
        query: "Need a first class flight from Chicago to Seattle tomorrow"
    },
    {
        name: "Weekend trip",
        query: "Round trip to Las Vegas this weekend from Los Angeles"
    },
    {
        name: "International with dates",
        query: "Flight to London on August 15th, returning August 30th"
    },
    {
        name: "Budget conscious",
        query: "Cheapest flight to Miami from Boston"
    },
    {
        name: "Multi-city request",
        query: "I need flights from NYC to Paris, then Paris to Rome, then Rome back to NYC"
    },
    {
        name: "Non-booking query (should be rejected)",
        query: "What's the weather like in Paris?"
    },
    {
        name: "Ambiguous travel query",
        query: "How do I get to the airport?"
    }
];

/**
 * Make API request and format response
 */
async function testBookingExtraction(testCase) {
    try {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        console.log(`📝 Query: "${testCase.query}"`);
        console.log('─'.repeat(80));
        
        const response = await axios.post(API_URL, {
            query: testCase.query
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = response.data;
        
        if (!data.is_flight_booking) {
            console.log('❌ Not a flight booking query');
            console.log(`💬 Message: ${data.message}`);
            return;
        }
        
        console.log('✅ Flight booking detected');
        console.log(`🎯 Confidence: ${data.extraction.confidence}`);
        
        // Display extracted information
        const extracted = data.extraction.extracted_info;
        console.log('\n📊 Extracted Information:');
        console.log(`   Trip Type: ${extracted.trip_type || 'Not specified'}`);
        console.log(`   Passengers: ${extracted.passengers.adults || 0} adults, ${extracted.passengers.children || 0} children, ${extracted.passengers.infants || 0} infants`);
        console.log(`   Origin: ${extracted.origin || 'Not specified'}`);
        console.log(`   Destination: ${extracted.destination || 'Not specified'}`);
        console.log(`   Departure: ${extracted.departure_date || 'Not specified'}`);
        console.log(`   Return: ${extracted.return_date || 'Not specified'}`);
        console.log(`   Class: ${extracted.class || 'Not specified'}`);
        
        // Display missing fields
        if (data.extraction.missing_fields.length > 0) {
            console.log(`\n⚠️  Missing Fields: ${data.extraction.missing_fields.join(', ')}`);
        } else {
            console.log('\n✅ All required fields provided');
        }
        
        // Display TTS response
        console.log(`\n🔊 TTS Response: "${data.extraction.tts_response}"`);
        
    } catch (error) {
        console.log('❌ API Error:');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${error.response.data.error || error.response.data.message}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

/**
 * Run all test cases
 */
async function runAllTests() {
    console.log('🚀 Flight Booking Extraction API Test Suite');
    console.log('=' .repeat(80));
    console.log(`📡 Testing API endpoint: ${API_URL}`);
    console.log(`🧪 Running ${testCases.length} test cases...\n`);
    
    // Test API health first
    try {
        await axios.get('http://localhost:3001/api/health');
        console.log('✅ API server is healthy\n');
    } catch (error) {
        console.log('❌ API server is not responding. Please start the server first.');
        console.log('   Run: npm run launch\n');
        return;
    }
    
    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
        await testBookingExtraction(testCases[i]);
        
        // Add delay between requests to avoid overwhelming the API
        if (i < testCases.length - 1) {
            console.log('\n⏳ Waiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('=' .repeat(80));
}

/**
 * Run a specific test case by name
 */
async function runSpecificTest(testName) {
    const testCase = testCases.find(tc => tc.name.toLowerCase().includes(testName.toLowerCase()));
    
    if (!testCase) {
        console.log(`❌ Test case "${testName}" not found.`);
        console.log('\nAvailable test cases:');
        testCases.forEach((tc, index) => {
            console.log(`   ${index + 1}. ${tc.name}`);
        });
        return;
    }
    
    console.log('🚀 Flight Booking Extraction API - Single Test');
    console.log('=' .repeat(80));
    
    await testBookingExtraction(testCase);
    
    console.log('\n✅ Test completed!');
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Run specific test
        runSpecificTest(args.join(' '));
    } else {
        // Run all tests
        runAllTests();
    }
}

module.exports = { testBookingExtraction, runAllTests, runSpecificTest };
