import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';
import EscalationBanner from './EscalationBanner.jsx';

export default function ChatWindow({
  activeBusiness,
  messages,
  isLoading,
  activeEscalation,
  onDismissEscalation,
  onSendMessage,
  onClearChat,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, activeEscalation]);

  // Focus input on business switch
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeBusiness]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isBakery = activeBusiness?.business_id === 'sweet-home-kitchen';
  const isRealEstate = activeBusiness?.business_id === 'elite-properties';
  const avatarIcon = isBakery ? '🧁' : isRealEstate ? '🏢' : '✨';

  // Dynamic quick suggestions
  let suggestions = [];
  if (isBakery) {
    suggestions = [
      '🎂 What cakes do you have and prices?',
      '📦 Order 1kg chocolate cake for tomorrow',
      '⚠️ Can you make a 5-tier wedding cake? (Escalation)',
      '📍 Hours & location',
    ];
  } else if (isRealEstate) {
    suggestions = [
      '🏠 What 2-bedroom rentals do you have?',
      '🔑 Schedule an inspection viewing',
      '⚠️ Can I order a chocolate cake? (Tenant Isolation)',
      '📋 Lease terms & security deposit',
    ];
  } else {
    suggestions = [
      '📋 What services and pricing do you offer?',
      '📅 How do I book an appointment?',
      '⚠️ Severe emergency surgery (Escalation)',
      '📍 Hours and office location',
    ];
  }

  return (
    <div className="ai-conversation-pane">
      {/* Top Conversation Header */}
      <div className="conversation-hero-banner">
        <div className="hero-biz-identity">
          <span className="hero-avatar">{avatarIcon}</span>
          <div className="hero-names">
            <h2>{activeBusiness?.name}</h2>
            <p>
              <span className="gemma-pulse-dot" />
              {isLoading ? 'Gemma 2 synthesizing grounded reply...' : 'Online • Grounded in Markdown'}
            </p>
          </div>
        </div>

        <div className="hero-quick-actions">
          {onClearChat && (
            <button
              className="btn-glass-action"
              onClick={onClearChat}
              title="Reset conversation"
            >
              🔄 Reset Chat
            </button>
          )}
        </div>
      </div>

      {/* Suggested Prompts Strip */}
      <div className="prompt-chips-flow">
        <span className="flow-label">Quick Prompts:</span>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            className="flow-chip"
            onClick={() => onSendMessage(sug)}
            disabled={isLoading}
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="messages-stream-container">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {/* Typing Wave Animation */}
        {isLoading && (
          <div className="message-entry assistant">
            <div className="sender-avatar-bubble">✨</div>
            <div className="bubble-card">
              <div className="typing-wave-container">
                <span className="typing-bar" />
                <span className="typing-bar" />
                <span className="typing-bar" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Escalation Warning */}
      <EscalationBanner
        escalationReason={activeEscalation}
        onDismiss={onDismissEscalation}
      />

      {/* Floating Prompt Input Bar */}
      <form className="unique-input-container" onSubmit={handleSubmit}>
        <div className="glow-input-shell">
          <input
            ref={inputRef}
            type="text"
            className="glow-text-input"
            placeholder={`Ask ${activeBusiness?.name || 'assistant'} anything... (e.g. pricing, booking)`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="btn-launch-prompt"
          disabled={!inputText.trim() || isLoading}
          title="Send query"
          aria-label="Send query"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
