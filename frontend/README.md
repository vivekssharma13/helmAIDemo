# HelmAI Frontend

A React-based frontend for the HelmAI vector embedding system with speech-to-text capabilities.

## Features

- 🎤 **Speech Recognition**: Click the mic button to speak your queries
- 💬 **Real-time Chat**: Instant responses from the HelmAI backend
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 🔍 **Semantic Search**: Powered by ChromaDB and Ollama embeddings

## Quick Start

1. **Ensure Backend is Running**: Make sure the HelmAI backend is running on port 3001
2. **Install Dependencies**: `npm install`
3. **Start Development Server**: `npm start`
4. **Open Browser**: Visit http://localhost:3000

## Usage

### Text Input
- Type your question in the text area
- Click the send button or press Enter

### Voice Input
- Click the microphone button
- Speak your question clearly
- The system will automatically process your speech and send the query

## Speech Recognition Notes

- **Browser Support**: Works in Chrome, Safari, and Edge
- **Permissions**: Browser will request microphone access
- **Languages**: Currently configured for English (US)
- **Quality**: Best results with clear speech and minimal background noise

## API Integration

The frontend connects to the HelmAI backend running on port 3001:
- **Endpoint**: `/api/chat`
- **Method**: POST
- **Proxy**: Configured in package.json for seamless development

## Component Structure

```
src/
├── components/
│   ├── ChatWidget.js     # Main chat component with speech recognition
│   └── ChatWidget.css    # Styling for the chat interface
├── App.js                # Root component
├── App.css              # Global styling
└── index.js             # React entry point
```

## Browser Compatibility

- **Speech Recognition**: Chrome 25+, Safari 6.1+, Edge 79+
- **React**: All modern browsers
- **CSS Features**: Grid, Flexbox, CSS Variables support required

## Development

- **React Version**: 18.2.0
- **Build Tool**: Create React App
- **HTTP Client**: Axios for API communication
- **Styling**: Pure CSS with modern features

## Production Deployment

1. **Build**: `npm run build`
2. **Serve**: Deploy the `build/` folder to your web server
3. **Backend**: Ensure the API endpoint is accessible
4. **HTTPS**: Required for speech recognition in production

## Troubleshooting

### Speech Recognition Issues
- Ensure microphone permissions are granted
- Check browser compatibility
- Verify HTTPS in production environments

### API Connection Issues
- Confirm backend is running on port 3001
- Check proxy configuration in package.json
- Verify CORS settings on the backend

### Performance
- Initial load may take a few seconds for Ollama model
- Speech recognition requires stable internet connection
- Chat history is stored in component state (resets on refresh)
