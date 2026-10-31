import React from 'react';

export default function EscalationBanner({ escalationReason, onDismiss }) {
  if (!escalationReason) return null;

  return (
    <div className="unique-escalation-alert" role="alert">
      <div className="escalation-glow-icon">!</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fb7185' }}>
            Human Manager Escalation Triggered
          </span>
          <span style={{ background: '#f43f5e', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
            POLICY BOUNDARY
          </span>
        </div>
        <div style={{ fontSize: '0.825rem', color: '#fecdd3', lineHeight: 1.4 }}>
          <strong>Reason:</strong> {escalationReason}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#fda4af', marginTop: '4px', fontStyle: 'italic' }}>
          Gemma 2 detected that this inquiry requires custom human triage. A notification has been flagged to the business manager.
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', color: '#fda4af', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}
          title="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
