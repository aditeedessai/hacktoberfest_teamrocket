import React from 'react';
import ChatWindow from './ChatWindow.jsx';

export default function CustomerPortal({
  currentUser,
  businesses,
  activeBusiness,
  onSelectBusiness,
  messages,
  isLoading,
  activeEscalation,
  onDismissEscalation,
  onSendMessage,
  onClearChat,
  onSwitchToOwnerMode,
  onLogout,
}) {
  const isBakery = activeBusiness?.business_id === 'sweet-home-kitchen';
  const isRealEstate = activeBusiness?.business_id === 'elite-properties';

  return (
    <div className="app-ambient-canvas">
      {/* Top Floating Glass Header */}
      <header className="unique-header">
        <div className="brand-capsule">
          <div className="brand-orb">🚀</div>
          <div className="brand-title-wrap">
            <h1>Open Business AI</h1>
            <p>Customer AI Concierge</p>
          </div>
        </div>

        {/* Role Segmented Pill Switcher */}
        <div className="role-segmented-pill">
          <button className="pill-option-btn active">
            👤 Customer View
          </button>
          <button
            className="pill-option-btn"
            onClick={onSwitchToOwnerMode}
            title="Switch to Merchant Studio"
          >
            💼 Merchant Studio →
          </button>
        </div>

        <div className="header-right-tools">
          {currentUser && (
            <div className="user-profile-badge" title={currentUser.email}>
              <span className="user-profile-avatar">👤</span>
              <span className="user-profile-name">{currentUser.name || currentUser.email}</span>
            </div>
          )}
          <div className="gemma-telemetry-chip">
            <span className="gemma-pulse-dot" />
            <span>Gemma 2 Powered</span>
          </div>
          {onLogout && (
            <button
              className="btn-glass-action"
              onClick={onLogout}
              title="Sign out of customer portal"
            >
              🚪 Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Main 3-Column Interactive Workspace */}
      <div className="unique-workspace">
        {/* ================= LEFT: BUSINESS EXPLORER ================= */}
        <aside className="biz-explorer-pane">
          <div className="explorer-header">
            <h3>Verified Businesses</h3>
            <p>Select a business to chat with its AI assistant</p>
          </div>

          <div className="biz-cards-stack">
            {businesses.map((biz) => {
              const isSelected = biz.business_id === activeBusiness?.business_id;
              const isBizBakery = biz.business_id === 'sweet-home-kitchen';
              const isBizRealEstate = biz.business_id === 'elite-properties';
              const avatar = isBizBakery ? '🧁' : isBizRealEstate ? '🏢' : '✨';

              return (
                <div
                  key={biz.business_id}
                  className={`biz-select-card ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectBusiness(biz.business_id)}
                >
                  <div className="biz-icon-box">{avatar}</div>
                  <div className="biz-card-content">
                    <div className="biz-card-title">{biz.name}</div>
                    <div className="biz-card-category">{biz.category}</div>
                    <div className="biz-card-hours">
                      🕒 {biz.hours || (isBizBakery ? 'Tue–Sun: 8am–6pm' : 'Mon–Fri: 9am–5pm')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ================= CENTER: AI CONVERSATION ================= */}
        <ChatWindow
          activeBusiness={activeBusiness}
          messages={messages}
          isLoading={isLoading}
          activeEscalation={activeEscalation}
          onDismissEscalation={onDismissEscalation}
          onSendMessage={onSendMessage}
          onClearChat={onClearChat}
        />

        {/* ================= RIGHT: BUSINESS DETAILS DRAWER ================= */}
        <aside className="knowledge-showcase-pane">
          <div className="showcase-header">
            <h3>Business Profile</h3>
            <span className="showcase-badge">Verified Tenant</span>
          </div>

          <div className="showcase-body">
            {/* Overview */}
            <div className="info-capsule">
              <span className="capsule-label">About the Business</span>
              <p className="capsule-val">{activeBusiness?.description}</p>
            </div>

            {/* Hours */}
            <div className="info-capsule">
              <span className="capsule-label">Operating Schedule</span>
              <p className="capsule-val">
                {activeBusiness?.hours || (isBakery ? 'Tuesday - Sunday: 08:00 AM – 06:00 PM' : 'Monday - Friday: 09:00 AM – 05:00 PM')}
              </p>
              <span className="capsule-sub" style={{ color: '#2563eb', fontWeight: 700 }}>
                ● Open Now for Customer Inquiries
              </span>
            </div>

            {/* Address */}
            <div className="info-capsule">
              <span className="capsule-label">Location & Pickup</span>
              <p className="capsule-val">
                {activeBusiness?.address || (isBakery ? '42 Maple Street' : 'Suite 10, Downtown')}
              </p>
              <span className="capsule-sub">In-store pickup & local service available</span>
            </div>

            {/* Contact */}
            <div className="info-capsule">
              <span className="capsule-label">Direct Contact</span>
              <p className="capsule-val">{activeBusiness?.phone || '+1 (555) 234-5678'}</p>
            </div>

            {/* AI Grounding info */}
            <div className="info-capsule" style={{ background: 'var(--accent-primary-light)', borderColor: 'var(--accent-primary-border)' }}>
              <span className="capsule-label" style={{ color: 'var(--accent-primary)' }}>AI Knowledge Grounding</span>
              <p className="capsule-val" style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                This assistant is strictly grounded in {activeBusiness?.fileCount || 4} verified Markdown skill files. Zero hallucinations, verified prices.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
