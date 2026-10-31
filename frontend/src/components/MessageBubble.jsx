import React from 'react';

/**
 * Format markdown bold text, lists, and linebreaks cleanly
 */
function formatMessageContent(text, isCustomer) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    const isBullet = line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const cleanLine = isBullet ? line.replace(/^[\s•\-\*]+/, '') : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const parsedText = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={pIdx}
            style={{ color: isCustomer ? '#ffffff' : '#0f172a', fontWeight: 800 }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={idx} style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
          <span style={{ color: isCustomer ? 'var(--opti-lime)' : '#597d04', fontWeight: 700 }}>✦</span>
          <span>{parsedText}</span>
        </div>
      );
    }

    if (!line.trim()) {
      return <div key={idx} style={{ height: '8px' }} />;
    }

    return (
      <div key={idx} style={{ margin: '2px 0' }}>
        {parsedText}
      </div>
    );
  });
}

export default function MessageBubble({ message }) {
  const isCustomer = message.sender === 'customer';
  const timestamp = message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`message-entry ${message.sender}`}>
      <div className="sender-avatar-bubble">
        {isCustomer ? '👤' : '⚡'}
      </div>

      <div className="bubble-card">
        <div className="bubble-text">
          {formatMessageContent(message.text, isCustomer)}
        </div>

        <div className="message-meta-row">
          <span>{timestamp}</span>
          {!isCustomer && (
            <span className="grounded-badge">
              ⚡ Gemma 2 Grounded
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
