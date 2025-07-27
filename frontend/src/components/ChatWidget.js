import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatWidget.css';
import './ChatWidget.css';

const ChatWidget = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you with your flight today? You can type or click the microphone to speak.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        addMessage('Sorry, I had trouble hearing you. Please try again or type your message.', 'bot');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text, sender) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    addMessage(userMessage, 'user');
    setInputText('');
    setIsLoading(true);

    try {
      // Call HelmAI search API
      const response = await axios.post('/api/search', {
        query: userMessage
      });

      if (response.data.success && response.data.results.length > 0) {
        const bestResult = response.data.results[0];
        const botResponse = `Based on your query about "${userMessage}", here's what I found:\n\n${bestResult.text}\n\n(Confidence: ${bestResult.confidence}% | Category: ${bestResult.category})`;
        addMessage(botResponse, 'bot');
      } else {
        addMessage("I apologize, but I couldn't find specific information about your request. Could you please rephrase your question or try asking about flight booking, cancellation, baggage, or check-in?", 'bot');
      }
    } catch (error) {
      console.error('API Error:', error);
      addMessage("I'm experiencing technical difficulties. Please make sure the HelmAI backend is running on port 3001, or try again later.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
    } else {
      addMessage("Speech recognition is not supported in your browser. Please type your message instead.", 'bot');
    }
  };

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>AI Assistant Online</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">{formatTimestamp(message.timestamp)}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening... speak now" : "Type your message or click the microphone to speak"}
            disabled={isListening || isLoading}
            rows="1"
          />
          <button
            className={`mic-button ${isListening ? 'listening' : ''}`}
            onClick={startListening}
            disabled={isListening || isLoading}
            title="Click to speak"
          >
            🎤
          </button>
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isListening || isLoading}
            title="Send message"
          >
            ➤
          </button>
        </div>
        <div className="input-help">
          💡 Try asking: "How do I book a flight?", "Cancel my reservation", "Baggage rules"
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
