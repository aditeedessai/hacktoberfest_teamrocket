import React, { useState } from 'react';

export default function NewBusinessWizard({ initialData, onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [previewTab, setPreviewTab] = useState('form'); // 'form' | 'markdown'

  // Step 1: Company Profile
  const [name, setName] = useState(initialData?.companyName || 'Sunrise Dental Care');
  const [category, setCategory] = useState(initialData?.category || 'Health Clinic & Dental');
  const [address, setAddress] = useState('742 Evergreen Terrace, Suite 102');
  const [phone, setPhone] = useState('+1 (555) 349-2041');
  const [hours, setHours] = useState('Mon–Fri: 08:30 AM – 05:30 PM, Sat: 09:00 AM – 01:00 PM');
  const [description, setDescription] = useState('Comprehensive family dental clinic offering routine exams, gentle cleanings, and cosmetic restorations.');

  // Step 2: Structured Products / Services Repeater (NO RAW MARKDOWN)
  const [products, setProducts] = useState([
    {
      id: 1,
      category: 'Routine Care',
      name: 'Comprehensive Dental Examination & X-Rays',
      price: '$85',
      details: 'Full diagnostic checkup, oral cancer screening & digital radiographs',
    },
    {
      id: 2,
      category: 'Routine Care',
      name: 'Standard Scale & Polish Hygiene Cleaning',
      price: '$110',
      details: 'Ultrasonic plaque scaling, fluoride treatment & enamel polish',
    },
    {
      id: 3,
      category: 'Cosmetic',
      name: 'In-Office Laser Teeth Whitening',
      price: '$280',
      details: 'Professional 60-minute shade brightening treatment',
    },
    {
      id: 4,
      category: 'Cosmetic',
      name: 'Composite Tooth-Colored Filling',
      price: '$140 – $210',
      details: 'Durable resin restoration matched to natural tooth shade',
    },
  ]);

  // Step 3: Structured FAQs Builder (NO RAW MARKDOWN)
  const [faqs, setFaqs] = useState([
    {
      id: 1,
      question: 'Do you accept dental insurance?',
      answer: 'Yes, we direct-bill all major insurance providers. Any co-payments are due at the time of your appointment.',
    },
    {
      id: 2,
      question: 'Do you treat walk-in emergencies?',
      answer: 'We reserve two emergency priority slots daily at 11:00 AM and 3:30 PM. Please call or message us before arriving.',
    },
    {
      id: 3,
      question: 'What is your appointment cancellation policy?',
      answer: 'We require a minimum 24-hour advance notice to reschedule or cancel without incurring a $50 late fee.',
    },
  ]);

  // Step 4: Bot Procedures & Safeguards (NO RAW MARKDOWN)
  const [leadTime, setLeadTime] = useState('24 hours advance notice');
  const [requireName, setRequireName] = useState(true);
  const [requirePhone, setRequirePhone] = useState(true);
  const [requireDateTime, setRequireDateTime] = useState(true);
  const [requireDetails, setRequireDetails] = useState(true);
  const [requireAddress, setRequireAddress] = useState(false);
  const [escalationBoundary, setEscalationBoundary] = useState(
    'Acute trauma, surgical extractions, payment disputes, or requests exceeding $500 must be escalated immediately to our on-call dental supervisor.'
  );
  const [cancellationPolicy, setCancellationPolicy] = useState(
    'Cancellations require at least 24 hours notice. Late cancellations may incur a standard reservation charge.'
  );

  // Helper functions to add/delete products
  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: 'Services',
        name: '',
        price: '$0',
        details: '',
      },
    ]);
  };

  const handleUpdateProduct = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleDeleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Helper functions to add/delete FAQs
  const handleAddFaq = () => {
    setFaqs((prev) => [
      ...prev,
      {
        id: Date.now(),
        question: '',
        answer: '',
      },
    ]);
  };

  const handleUpdateFaq = (id, field, value) => {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleDeleteFaq = (id) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  // Compile structured inputs into pristine Markdown skill pack
  const businessId =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'new-business';

  // Group products by category for clean markdown compilation
  const categoriesMap = {};
  products.forEach((p) => {
    const cat = p.category.trim() || 'General Items';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(p);
  });

  let compiledPricingMd = `# Services & Pricing: ${name}\n\n`;
  Object.keys(categoriesMap).forEach((cat) => {
    compiledPricingMd += `### ${cat}\n`;
    categoriesMap[cat].forEach((item) => {
      compiledPricingMd += `- **${item.name || 'Unnamed Item'}**: ${item.price || 'Contact for price'}\n`;
      if (item.details) {
        compiledPricingMd += `  - Details: ${item.details}\n`;
      }
    });
    compiledPricingMd += '\n';
  });

  let compiledFaqsMd = `# Frequently Asked Questions & Policies\n\n`;
  faqs.forEach((f) => {
    compiledFaqsMd += `- **Q: ${f.question || 'Inquiry'}**\n  - A: ${f.answer || 'Contact business directly for assistance.'}\n`;
  });

  let compiledProcedureMd = `# Customer Inquiry & Booking Procedure\n\n`;
  compiledProcedureMd += `1. **Advance Booking Notice**: ${leadTime}\n`;
  compiledProcedureMd += `2. **Required Information to Collect from Customer**:\n`;
  if (requireName) compiledProcedureMd += `   - Full customer / patient name\n`;
  if (requirePhone) compiledProcedureMd += `   - Primary contact phone number\n`;
  if (requireDateTime) compiledProcedureMd += `   - Preferred appointment date & morning/afternoon preference\n`;
  if (requireDetails) compiledProcedureMd += `   - Specific service or reason for visit\n`;
  if (requireAddress) compiledProcedureMd += `   - Service delivery or home address\n`;
  compiledProcedureMd += `3. **Human Escalation Boundaries**:\n   - ${escalationBoundary}\n`;
  compiledProcedureMd += `4. **Deposit & Cancellation Policy**:\n   - ${cancellationPolicy}\n`;

  const compiledProfileMd = `# ${name} - Business Profile\n\n- **Category**: ${category}\n- **Address**: ${address}\n- **Phone**: ${phone}\n- **Operating Hours**: ${hours}\n- **About**: ${description}\n`;

  const generatedPack = {
    'profile.md': compiledProfileMd,
    'pricing_menu.md': compiledPricingMd,
    'faqs.md': compiledFaqsMd,
    'ordering_procedure.md': compiledProcedureMd,
  };

  const handleFinish = () => {
    const newBizObject = {
      business_id: businessId,
      name,
      category,
      description,
      hours,
      address,
      phone,
      fileCount: 4,
      pack: {
        business_id: businessId,
        files: generatedPack,
      },
    };

    onComplete(newBizObject);
  };

  return (
    <div className="wizard-backdrop">
      <div className="wizard-modal">
        {/* Wizard Header */}
        <div className="wizard-header">
          <div className="wizard-title-area">
            <span className="wizard-badge">Guided AI Setup</span>
            <h2>Create Your Business AI Assistant</h2>
            <p>
              Fill out simple form fields. Our system compiles them into verified Markdown skill files for Google Gemma AI.
            </p>
          </div>
          <button className="wizard-close-btn" onClick={onCancel} title="Exit setup">
            ✕
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="wizard-steps-nav">
          <div
            className={`step-nav-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(1)}
          >
            <span className="step-number">1</span>
            <span className="step-label">Company Profile</span>
          </div>
          <div
            className={`step-nav-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(2)}
          >
            <span className="step-number">2</span>
            <span className="step-label">Products & Pricing</span>
          </div>
          <div
            className={`step-nav-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
            onClick={() => setCurrentStep(3)}
          >
            <span className="step-number">3</span>
            <span className="step-label">FAQs & Answers</span>
          </div>
          <div
            className={`step-nav-item ${currentStep === 4 ? 'active' : ''}`}
            onClick={() => setCurrentStep(4)}
          >
            <span className="step-number">4</span>
            <span className="step-label">Rules & Deploy</span>
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="wizard-body">
          {/* ================= STEP 1: COMPANY PROFILE ================= */}
          {currentStep === 1 && (
            <div className="wizard-step-pane">
              <div className="step-pane-intro">
                <h3 className="pane-heading">Step 1: Basic Business Profile & Hours</h3>
                <p className="pane-subheading">
                  Enter your business contact details. Gemma AI uses these to answer hours and location questions.
                </p>
              </div>

              <div className="wizard-grid-2">
                <div className="form-group">
                  <label className="form-label">Business / Brand Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sunrise Dental Care"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Category</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Health Clinic & Dental">Health Clinic & Dental</option>
                    <option value="Bakery & Confectionery">Bakery & Confectionery</option>
                    <option value="Real Estate Agency">Real Estate Agency</option>
                    <option value="Boutique Cafe & Restaurant">Boutique Cafe & Restaurant</option>
                    <option value="Automotive & Repair Shop">Automotive & Repair Shop</option>
                    <option value="Consulting & Legal Services">Consulting & Legal Services</option>
                    <option value="Custom Retail & Services">Other Local Business</option>
                  </select>
                </div>
              </div>

              <div className="wizard-grid-2">
                <div className="form-group">
                  <label className="form-label">Physical Address / Pickup Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, Suite 102"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone / WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 349-2041"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Operating Schedule & Opening Hours</label>
                <input
                  type="text"
                  className="form-input"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g. Mon–Fri: 8:30 AM – 5:30 PM, Sat: 9:00 AM – 1:00 PM"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Description / Specialty</label>
                <textarea
                  className="form-input"
                  style={{ height: '70px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what your business offers and what makes your service stand out."
                />
              </div>
            </div>
          )}

          {/* ================= STEP 2: PRODUCTS & PRICING BUILDER ================= */}
          {currentStep === 2 && (
            <div className="wizard-step-pane">
              <div className="pane-header-with-toggle">
                <div>
                  <h3 className="pane-heading">Step 2: Products & Pricing Catalog</h3>
                  <p className="pane-subheading">
                    Add your items below in clean form fields. No markdown syntax required!
                  </p>
                </div>
                <div className="mode-toggle-pill">
                  <button
                    type="button"
                    className={`mode-toggle-btn ${previewTab === 'form' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('form')}
                  >
                    📋 Form Builder
                  </button>
                  <button
                    type="button"
                    className={`mode-toggle-btn ${previewTab === 'markdown' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('markdown')}
                  >
                    👁️ Markdown Preview
                  </button>
                </div>
              </div>

              {previewTab === 'form' ? (
                <div className="interactive-catalog-builder">
                  <div className="builder-items-list">
                    {products.map((item, index) => (
                      <div key={item.id} className="catalog-item-row-card">
                        <span className="item-row-index">#{index + 1}</span>
                        <div className="catalog-row-fields">
                          <div className="field-subrow">
                            <div className="form-group flex-2">
                              <label className="field-tiny-label">Item / Service Name</label>
                              <input
                                type="text"
                                className="form-input input-compact"
                                placeholder="e.g. Dental Cleaning, Chocolate Cake"
                                value={item.name}
                                onChange={(e) => handleUpdateProduct(item.id, 'name', e.target.value)}
                              />
                            </div>
                            <div className="form-group flex-1">
                              <label className="field-tiny-label">Price / Rate</label>
                              <input
                                type="text"
                                className="form-input input-compact"
                                placeholder="e.g. $85, $35/kg"
                                value={item.price}
                                onChange={(e) => handleUpdateProduct(item.id, 'price', e.target.value)}
                              />
                            </div>
                            <div className="form-group flex-1">
                              <label className="field-tiny-label">Category</label>
                              <input
                                type="text"
                                className="form-input input-compact"
                                placeholder="e.g. Routine, Cakes"
                                value={item.category}
                                onChange={(e) => handleUpdateProduct(item.id, 'category', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="field-tiny-label">Description / Ingredients / Lead Time</label>
                            <input
                              type="text"
                              className="form-input input-compact"
                              placeholder="e.g. Includes digital x-rays, requires 24h advance booking"
                              value={item.details}
                              onChange={(e) => handleUpdateProduct(item.id, 'details', e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-delete-row"
                          onClick={() => handleDeleteProduct(item.id)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="builder-actions-bar">
                    <button
                      type="button"
                      className="btn-add-item-dashed"
                      onClick={handleAddProduct}
                    >
                      ➕ Add Another Product / Service
                    </button>
                  </div>
                </div>
              ) : (
                <div className="markdown-preview-pane">
                  <div className="preview-info-banner">
                    ⚡ <strong>Auto-Compiled Markdown (`pricing_menu.md`):</strong> This is the clean, grounded knowledge file generated from your fields for Gemma AI.
                  </div>
                  <pre className="compiled-code-display">{compiledPricingMd}</pre>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: FAQS BUILDER ================= */}
          {currentStep === 3 && (
            <div className="wizard-step-pane">
              <div className="pane-header-with-toggle">
                <div>
                  <h3 className="pane-heading">Step 3: Frequently Asked Questions (FAQs)</h3>
                  <p className="pane-subheading">
                    Provide answers to questions customers ask regularly. The AI references these directly.
                  </p>
                </div>
                <div className="mode-toggle-pill">
                  <button
                    type="button"
                    className={`mode-toggle-btn ${previewTab === 'form' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('form')}
                  >
                    📋 FAQ Builder
                  </button>
                  <button
                    type="button"
                    className={`mode-toggle-btn ${previewTab === 'markdown' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('markdown')}
                  >
                    👁️ Markdown Preview
                  </button>
                </div>
              </div>

              {previewTab === 'form' ? (
                <div className="interactive-faq-builder">
                  <div className="faqs-list-stack">
                    {faqs.map((faq, index) => (
                      <div key={faq.id} className="faq-item-card">
                        <div className="faq-card-header">
                          <span className="faq-num-pill">Question {index + 1}</span>
                          <button
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleDeleteFaq(faq.id)}
                            title="Remove question"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="form-group">
                          <label className="field-tiny-label">Customer Question</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Do you deliver? Do you accept credit cards?"
                            value={faq.question}
                            onChange={(e) => handleUpdateFaq(faq.id, 'question', e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="field-tiny-label">Verified Answer</label>
                          <textarea
                            className="form-input"
                            style={{ height: '55px', resize: 'vertical' }}
                            placeholder="State your business policy clearly and concisely."
                            value={faq.answer}
                            onChange={(e) => handleUpdateFaq(faq.id, 'answer', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="builder-actions-bar">
                    <button
                      type="button"
                      className="btn-add-item-dashed"
                      onClick={handleAddFaq}
                    >
                      ➕ Add Another Common Question
                    </button>
                  </div>
                </div>
              ) : (
                <div className="markdown-preview-pane">
                  <div className="preview-info-banner">
                    ⚡ <strong>Auto-Compiled Markdown (`faqs.md`):</strong> Formatted with strict truth constraints.
                  </div>
                  <pre className="compiled-code-display">{compiledFaqsMd}</pre>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: WORKFLOW, PROCEDURES & DEPLOY ================= */}
          {currentStep === 4 && (
            <div className="wizard-step-pane">
              <div className="pane-header-with-toggle">
                <div>
                  <h3 className="pane-heading">Step 4: Booking Procedures & Escalation Safeguards</h3>
                  <p className="pane-subheading">
                    Define the rules Gemma AI must follow before confirming orders or transferring to a manager.
                  </p>
                </div>
                <div className="mode-toggle-pill">
                  <button
                    type="button"
                    className={`mode-toggle-btn ${previewTab === 'form' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('form')}
                  >
                    📋 Form Rules
                  </button>
                  <button
                    type="button"
                    className={`mode-toggle-btn ${previewTab === 'markdown' ? 'active' : ''}`}
                    onClick={() => setPreviewTab('markdown')}
                  >
                    👁️ Markdown Preview
                  </button>
                </div>
              </div>

              {previewTab === 'form' ? (
                <div className="procedure-rules-builder">
                  <div className="form-group">
                    <label className="form-label">Advance Booking Notice / Lead Time</label>
                    <input
                      type="text"
                      className="form-input"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      placeholder="e.g. 24 hours advance notice required"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      What Information Must the AI Collect from Customers?
                    </label>
                    <div className="checkbox-pills-grid">
                      <label className={`checkbox-pill ${requireName ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={requireName}
                          onChange={(e) => setRequireName(e.target.checked)}
                        />
                        <span>👤 Full Customer / Patient Name</span>
                      </label>
                      <label className={`checkbox-pill ${requirePhone ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={requirePhone}
                          onChange={(e) => setRequirePhone(e.target.checked)}
                        />
                        <span>📞 Contact Phone Number</span>
                      </label>
                      <label className={`checkbox-pill ${requireDateTime ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={requireDateTime}
                          onChange={(e) => setRequireDateTime(e.target.checked)}
                        />
                        <span>📅 Preferred Date & Time Window</span>
                      </label>
                      <label className={`checkbox-pill ${requireDetails ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={requireDetails}
                          onChange={(e) => setRequireDetails(e.target.checked)}
                        />
                        <span>📝 Service Type / Cake Size Specifics</span>
                      </label>
                      <label className={`checkbox-pill ${requireAddress ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={requireAddress}
                          onChange={(e) => setRequireAddress(e.target.checked)}
                        />
                        <span>📍 Delivery Address (if applicable)</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      🛡️ Human Escalation Boundary (When Should AI Alert a Manager?)
                    </label>
                    <textarea
                      className="form-input"
                      style={{ height: '65px', resize: 'vertical' }}
                      value={escalationBoundary}
                      onChange={(e) => setEscalationBoundary(e.target.value)}
                      placeholder="Define emergencies, custom multi-tier requests, refunds, or disputes that require human approval."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cancellation & Deposit Policy</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cancellationPolicy}
                      onChange={(e) => setCancellationPolicy(e.target.value)}
                      placeholder="e.g. 50% deposit required; 24-hour cancellation window."
                    />
                  </div>

                  <div className="gemma-ready-callout">
                    <div className="callout-icon">⚡</div>
                    <div>
                      <strong>Zero Hallucination Grounding Ready:</strong>
                      <p>
                        All 4 Markdown skill pack files (`profile.md`, `pricing_menu.md`, `faqs.md`, `ordering_procedure.md`) are generated automatically without you typing any code or syntax.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="markdown-preview-pane">
                  <div className="preview-info-banner">
                    ⚡ <strong>Auto-Compiled Markdown (`ordering_procedure.md`):</strong> Ingested directly into local Gemma inference.
                  </div>
                  <pre className="compiled-code-display">{compiledProcedureMd}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="wizard-footer">
          <button
            type="button"
            className="btn-header btn-header-secondary"
            onClick={currentStep === 1 ? onCancel : () => setCurrentStep((s) => s - 1)}
          >
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </button>

          <div className="wizard-footer-right">
            {currentStep < 4 ? (
              <button
                type="button"
                className="btn-header btn-header-primary"
                onClick={() => setCurrentStep((s) => s + 1)}
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                className="btn-header btn-header-primary deploy-btn"
                onClick={handleFinish}
              >
                🚀 Save Business & Launch AI Concierge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
