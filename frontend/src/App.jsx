import React, { useState, useEffect, useCallback } from 'react';
import BusinessSelector from './components/BusinessSelector.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import PackEditorModal from './components/PackEditorModal.jsx';
import AuthView from './components/AuthView.jsx';
import NewBusinessWizard from './components/NewBusinessWizard.jsx';
import CustomerPortal from './components/CustomerPortal.jsx';
import { api } from './services/api.js';

export default function App() {
  // Portal & Authentication State
  // portalMode: 'auth' | 'customer' | 'owner'
  const [portalMode, setPortalMode] = useState('auth');
  const [currentUser, setCurrentUser] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialData, setWizardInitialData] = useState(null);

  // Business & Chat State
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeEscalation, setActiveEscalation] = useState(null);
  const [escalationCount, setEscalationCount] = useState(0);
  const [telemetry, setTelemetry] = useState({
    latencyMs: null,
    isLive: false,
    modelName: 'Gemma 2 2B',
  });

  // Load business list on initial mount
  useEffect(() => {
    api.getBusinesses().then(({ data, isLive }) => {
      setBusinesses(data);
      setTelemetry((prev) => ({ ...prev, isLive }));
      if (data && data.length > 0 && !selectedBusinessId) {
        setSelectedBusinessId(data[0].business_id);
      }
    });
  }, []);

  const activeBusiness = businesses.find((b) => b.business_id === selectedBusinessId) || businesses[0];

  // Helper to generate tenant welcome greeting
  const getWelcomeMessage = useCallback((biz) => {
    if (!biz) return null;
    const isBakery = biz.business_id === 'sweet-home-kitchen';
    const isRealEstate = biz.business_id === 'elite-properties';

    let greetingText = `Welcome to **${biz.name}**! ✨\n\nI am your AI Concierge, grounded strictly in our verified business skill pack powered by **Google Gemma 2**. How may I assist you today?`;

    if (isBakery) {
      greetingText = `Welcome to **${biz.name}**! 🧁\n\nI am your automated bakery concierge, grounded directly in our menu, pricing, and ordering rules. Ask me about fresh cakes, sizes, pickup times, or tomorrow's delivery.`;
    } else if (isRealEstate) {
      greetingText = `Welcome to **${biz.name}**! 🏢\n\nI am your property advisory assistant, powered by active rental listings and viewing guidelines. Inquire about residential rentals, property specs, or inspection registrations.`;
    } else {
      greetingText = `Welcome to **${biz.name}** (${biz.category})! ✨\n\nI am your business reply assistant, strictly grounded in your company's Markdown skill pack. Ask about our services, pricing, or appointment procedures!`;
    }

    return {
      sender: 'assistant',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }, []);

  // When selected business changes, reset conversation (Strict Tenant Isolation)
  useEffect(() => {
    if (!selectedBusinessId || !activeBusiness) return;
    setActiveEscalation(null);
    const welcome = getWelcomeMessage(activeBusiness);
    setMessages(welcome ? [welcome] : []);
  }, [selectedBusinessId, getWelcomeMessage]);

  // Handle Customer Portal Entry
  const handleEnterAsCustomer = (businessId, user = null) => {
    if (businessId) setSelectedBusinessId(businessId);
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser({ name: 'Guest Customer', role: 'customer' });
    }
    setPortalMode('customer');
  };

  // Handle Business Owner Login
  const handleLoginSuccess = ({ email, businessId, user = null }) => {
    setCurrentUser(user || { email, role: 'business_owner', business_id: businessId });
    if (businessId) setSelectedBusinessId(businessId);
    setPortalMode('owner');
  };

  // Handle Start New Business Onboarding
  const handleStartNewBusiness = (initialData) => {
    setWizardInitialData(initialData);
    setIsWizardOpen(true);
  };

  // Handle Wizard Completion
  const handleWizardComplete = async (newBusiness) => {
    await api.registerNewBusiness(newBusiness);
    setBusinesses((prev) => {
      const filtered = prev.filter((b) => b.business_id !== newBusiness.business_id);
      return [...filtered, newBusiness];
    });
    setSelectedBusinessId(newBusiness.business_id);
    setCurrentUser({
      name: newBusiness.name,
      email: newBusiness.adminEmail || 'admin@business.demo',
      role: 'business_owner',
      business_id: newBusiness.business_id,
    });
    setIsWizardOpen(false);
    setWizardInitialData(null);
    setPortalMode('owner');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    setPortalMode('auth');
    setActiveEscalation(null);
  };

  // Send inquiry handler
  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      sender: 'customer',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const history = updatedMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const response = await api.sendMessage(selectedBusinessId, text, history);

      const aiMessage = {
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: response.status,
        escalation_reason: response.escalation_reason,
      };

      setMessages((prev) => [...prev, aiMessage]);

      setTelemetry((prev) => ({
        ...prev,
        latencyMs: response.latencyMs,
        isLive: response.isLive,
      }));

      if (response.status === 'escalated') {
        setActiveEscalation(response.escalation_reason || 'Inquiry exceeds defined business knowledge boundaries.');
        setEscalationCount((c) => c + 1);
      } else {
        setActiveEscalation(null);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ An error occurred while communicating with the AI service. Please verify server connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setActiveEscalation(null);
    const welcome = getWelcomeMessage(activeBusiness);
    setMessages(welcome ? [welcome] : []);
  };

  // 1. IF PORTAL MODE IS 'auth' -> RENDER AUTH VIEW
  if (portalMode === 'auth') {
    return (
      <>
        <AuthView
          onLoginSuccess={handleLoginSuccess}
          onStartNewBusiness={handleStartNewBusiness}
          onEnterAsCustomer={handleEnterAsCustomer}
        />
        {isWizardOpen && (
          <NewBusinessWizard
            initialData={wizardInitialData}
            onComplete={handleWizardComplete}
            onCancel={() => setIsWizardOpen(false)}
          />
        )}
      </>
    );
  }

  // 2. IF PORTAL MODE IS 'customer' -> RENDER UNIQUE CUSTOMER EXPERIENCE
  if (portalMode === 'customer') {
    return (
      <CustomerPortal
        currentUser={currentUser}
        businesses={businesses}
        activeBusiness={activeBusiness}
        onSelectBusiness={setSelectedBusinessId}
        messages={messages}
        isLoading={isLoading}
        activeEscalation={activeEscalation}
        onDismissEscalation={() => setActiveEscalation(null)}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
        onSwitchToOwnerMode={() => setPortalMode('owner')}
        onLogout={handleLogout}
      />
    );
  }

  // 3. IF PORTAL MODE IS 'owner' -> RENDER MERCHANT OPERATING STUDIO
  return (
    <div className="app-ambient-canvas">
      {/* Top Floating Glass Header */}
      <header className="unique-header">
        <div className="brand-capsule">
          <div className="brand-orb">💼</div>
          <div className="brand-title-wrap">
            <h1>Open Business AI</h1>
            <p>Merchant Operating Studio</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="role-segmented-pill">
          <button
            className="pill-option-btn"
            onClick={() => setPortalMode('customer')}
            title="Preview Customer View"
          >
            👤 Customer View
          </button>
          <button className="pill-option-btn active">
            💼 Merchant Studio (Active)
          </button>
        </div>

        {/* Header Tools */}
        <div className="header-right-tools">
          {currentUser && (
            <div className="user-profile-badge" title={currentUser.email}>
              <span className="user-profile-avatar">👤</span>
              <span className="user-profile-name">{currentUser.name || currentUser.email}</span>
            </div>
          )}
          <button
            className="btn-glass-action"
            onClick={() => handleStartNewBusiness({ companyName: '', category: 'Health Clinic & Dental' })}
            title="Onboard new company"
          >
            ➕ Onboard Business
          </button>
          <button
            className="btn-glass-action"
            onClick={() => setIsEditorOpen(true)}
            style={{ background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
            title="View & Edit Markdown Pack"
          >
            📝 Edit Knowledge Pack
          </button>
          <button
            className="btn-glass-action"
            onClick={handleLogout}
            title="Exit to login"
          >
            🚪 Sign Out
          </button>
        </div>
      </header>

      {/* Merchant Telemetry Ribbon */}
      <div className="merchant-telemetry-bar">
        <div className="telemetry-tile">
          <span className="telemetry-tile-label">Runtime Engine</span>
          <span className="telemetry-tile-val">
            {telemetry.isLive ? '🔵 FastAPI Live' : '⚡ Local Fallback'}
          </span>
        </div>
        <div className="telemetry-tile">
          <span className="telemetry-tile-label">AI Target Model</span>
          <span className="telemetry-tile-val" style={{ color: '#818cf8' }}>
            ⚡ Gemma 2 2B
          </span>
        </div>
        <div className="telemetry-tile">
          <span className="telemetry-tile-label">Inference Latency</span>
          <span className="telemetry-tile-val">
            {telemetry.latencyMs ? `${(telemetry.latencyMs / 1000).toFixed(2)}s` : 'Instant'}
          </span>
        </div>
        <div className="telemetry-tile">
          <span className="telemetry-tile-label">Escalations Logged</span>
          <span className="telemetry-tile-val" style={{ color: escalationCount > 0 ? '#f43f5e' : 'inherit' }}>
            {escalationCount} Actionable
          </span>
        </div>
      </div>

      {/* Main 3-Column Workspace */}
      <div className="unique-workspace">
        {/* Left: Business Navigator */}
        <aside className="biz-explorer-pane">
          <div className="explorer-header">
            <h3>Active Tenants</h3>
            <p>Zero-code Markdown business packs</p>
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
                  onClick={() => setSelectedBusinessId(biz.business_id)}
                >
                  <div className="biz-icon-box">{avatar}</div>
                  <div className="biz-card-content">
                    <div className="biz-card-title">{biz.name}</div>
                    <div className="biz-card-category">{biz.category}</div>
                    <div className="biz-card-hours">
                      📄 {biz.fileCount || 4} Markdown files loaded
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Interactive AI Test Simulation */}
        <ChatWindow
          activeBusiness={activeBusiness}
          messages={messages}
          isLoading={isLoading}
          activeEscalation={activeEscalation}
          onDismissEscalation={() => setActiveEscalation(null)}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
        />

        {/* Right: Knowledge Base & Hot-Reload Drawer */}
        <aside className="knowledge-showcase-pane">
          <div className="showcase-header">
            <h3>Knowledge Pack</h3>
            <span className="showcase-badge">Markdown Source</span>
          </div>

          <div className="showcase-body">
            <div className="info-capsule">
              <span className="capsule-label">Tenant ID</span>
              <p className="capsule-val" style={{ fontFamily: 'var(--font-mono)' }}>
                {activeBusiness?.business_id}
              </p>
            </div>

            <div className="info-capsule">
              <span className="capsule-label">Verified Skill Files</span>
              <p className="capsule-val" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                • <code>profile.md</code><br />
                • <code>pricing_menu.md</code><br />
                • <code>faqs.md</code><br />
                • <code>ordering_procedure.md</code>
              </p>
            </div>

            <div className="info-capsule" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'var(--accent-primary)' }}>
              <span className="capsule-label" style={{ color: '#a5b4fc' }}>Live Hot-Reload</span>
              <p className="capsule-val" style={{ fontSize: '0.8rem' }}>
                Click below to modify pricing or policies. Edits take effect on subsequent messages without restarting the server.
              </p>
              <button
                className="btn-glass-action"
                style={{ marginTop: '8px', background: 'var(--accent-primary)', color: 'white' }}
                onClick={() => setIsEditorOpen(true)}
              >
                ✏️ Open Pack Editor
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Markdown Pack Editor Modal */}
      <PackEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        businessId={selectedBusinessId}
        businessName={activeBusiness?.name}
      />

      {/* New Business Wizard Modal */}
      {isWizardOpen && (
        <NewBusinessWizard
          initialData={wizardInitialData}
          onComplete={handleWizardComplete}
          onCancel={() => setIsWizardOpen(false)}
        />
      )}
    </div>
  );
}
