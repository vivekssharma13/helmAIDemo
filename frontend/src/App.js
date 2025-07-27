import React from 'react';
import './App.css';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🛫 HelmAI Customer Service</h1>
        <p>Voice-enabled airline assistance powered by AI</p>
      </header>
      <main className="App-main">
        <ChatWidget />
      </main>
    </div>
  );
}

export default App;
