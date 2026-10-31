import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

/**
 * Helper to parse a markdown menu / pricing file into structured items.
 */
function parsePricingItems(mdContent) {
  if (!mdContent) return [];
  const lines = mdContent.split('\n');
  const items = [];
  let currentCategory = 'General';
  let currentItem = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Section header
    if (line.startsWith('## ') || line.startsWith('### ')) {
      currentCategory = line.replace(/^#+\s*/, '').replace(/—.*$/, '').trim();
      continue;
    }

    // Bullet item with bold title: - **Item Name:** Price or details
    const itemMatch = line.match(/^[-*]\s+\*\*([^*]+)\*\*[:\s]*(.*)$/);
    if (itemMatch) {
      if (currentItem) items.push(currentItem);
      currentItem = {
        id: items.length + 1,
        category: currentCategory,
        name: itemMatch[1].replace(/[:]$/, '').trim(),
        price: itemMatch[2].trim() || 'Contact for price',
        details: '',
      };
      continue;
    }

    // Sub-bullet with details
    if (currentItem && (line.startsWith('- ') || line.startsWith('* '))) {
      const detailText = line.replace(/^[-*]\s+/, '').trim();
      currentItem.details = currentItem.details
        ? `${currentItem.details}; ${detailText}`
        : detailText;
    }
  }

  if (currentItem) items.push(currentItem);

  // Fallback defaults if empty or not parsed
  if (items.length === 0) {
    items.push({
      id: 1,
      category: 'Main Menu',
      name: 'Featured Special',
      price: '$25.00',
      details: 'Premium quality service or product',
    });
  }

  return items;
}

/**
 * Helper to serialize structured pricing items back into clean markdown.
 */
function serializePricingItems(items, businessName) {
  let md = `# ${businessName || 'Business'} — Products & Pricing\n\n`;
  const categoriesMap = {};

  items.forEach((item) => {
    const cat = item.category.trim() || 'General Items';
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(item);
  });

  Object.keys(categoriesMap).forEach((cat) => {
    md += `## ${cat}\n`;
    categoriesMap[cat].forEach((item) => {
      md += `- **${item.name || 'Unnamed Item'}:** ${item.price || 'Contact for price'}\n`;
      if (item.details) {
        md += `  - ${item.details}\n`;
      }
    });
    md += '\n';
  });

  return md.trim() + '\n';
}

/**
 * Helper to parse a markdown FAQs file into structured Q&As.
 */
function parseFaqItems(mdContent) {
  if (!mdContent) return [];
  const lines = mdContent.split('\n');
  const faqs = [];
  let currentQ = '';
  let currentA = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Format 1: ## Question Header
    if (line.startsWith('## ')) {
      if (currentQ) {
        faqs.push({ id: faqs.length + 1, question: currentQ, answer: currentA.trim() });
      }
      currentQ = line.replace(/^##\s+/, '').trim();
      currentA = '';
      continue;
    }

    // Format 2: - **Q: Question**
    const qMatch = line.match(/^[-*]\s+\*\*Q:?\s*([^*]+)\*\*/i);
    if (qMatch) {
      if (currentQ) {
        faqs.push({ id: faqs.length + 1, question: currentQ, answer: currentA.trim() });
      }
      currentQ = qMatch[1].trim();
      currentA = '';
      continue;
    }

    // Answer lines
    const aMatch = line.match(/^[-*]\s+A:?\s*(.*)$/i);
    if (aMatch) {
      currentA = currentA ? `${currentA} ${aMatch[1]}` : aMatch[1];
    } else if (currentQ && line && !line.startsWith('#')) {
      currentA = currentA ? `${currentA}\n${line}` : line;
    }
  }

  if (currentQ) {
    faqs.push({ id: faqs.length + 1, question: currentQ, answer: currentA.trim() });
  }

  if (faqs.length === 0) {
    faqs.push({
      id: 1,
      question: 'What are your policies and ordering times?',
      answer: 'Standard inquiries are processed within 24 hours.',
    });
  }

  return faqs;
}

/**
 * Helper to serialize FAQs back into clean markdown.
 */
function serializeFaqItems(faqs, businessName) {
  let md = `# ${businessName || 'Business'} — Frequently Asked Questions\n\n`;
  faqs.forEach((f) => {
    md += `## ${f.question || 'Inquiry'}\n${f.answer || 'Contact business staff directly.'}\n\n`;
  });
  return md.trim() + '\n';
}

export default function PackEditorModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  onFileSaved,
}) {
  const [packFiles, setPackFiles] = useState({});
  const [activeFile, setActiveFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mode Switcher: 'visual' (default, NO markdown symbols) | 'code'
  const [editorMode, setEditorMode] = useState('visual');

  // Structured states for visual editing
  const [pricingItems, setPricingItems] = useState([]);
  const [faqItems, setFaqItems] = useState([]);

  // Fetch pack files whenever modal opens or business changes
  useEffect(() => {
    if (!isOpen || !businessId) return;

    let isMounted = true;
    setIsLoading(true);

    api.getBusinessPack(businessId).then(({ data }) => {
      if (!isMounted) return;
      const files = data.files || {};
      setPackFiles(files);
      const fileNames = Object.keys(files);
      if (fileNames.length > 0) {
        const defaultFile = fileNames.includes('pricing_menu.md')
          ? 'pricing_menu.md'
          : fileNames.includes('property_listings.md')
          ? 'property_listings.md'
          : fileNames[0];
        setActiveFile(defaultFile);
        const content = files[defaultFile] || '';
        setFileContent(content);
        syncVisualState(defaultFile, content);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, businessId]);

  const syncVisualState = (fileName, content) => {
    if (fileName.includes('pricing') || fileName.includes('menu') || fileName.includes('listings')) {
      setPricingItems(parsePricingItems(content));
    } else if (fileName.includes('faq')) {
      setFaqItems(parseFaqItems(content));
    }
  };

  const handleTabClick = (fileName) => {
    setActiveFile(fileName);
    const content = packFiles[fileName] || '';
    setFileContent(content);
    syncVisualState(fileName, content);
  };

  // Structured Pricing Item Handlers
  const handleUpdateItem = (id, field, value) => {
    const updated = pricingItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setPricingItems(updated);
    const compiled = serializePricingItems(updated, businessName);
    setFileContent(compiled);
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      category: 'Menu Items',
      name: '',
      price: '$0.00',
      details: '',
    };
    const updated = [...pricingItems, newItem];
    setPricingItems(updated);
    const compiled = serializePricingItems(updated, businessName);
    setFileContent(compiled);
  };

  const handleDeleteItem = (id) => {
    const updated = pricingItems.filter((item) => item.id !== id);
    setPricingItems(updated);
    const compiled = serializePricingItems(updated, businessName);
    setFileContent(compiled);
  };

  // Structured FAQ Handlers
  const handleUpdateFaq = (id, field, value) => {
    const updated = faqItems.map((faq) =>
      faq.id === id ? { ...faq, [field]: value } : faq
    );
    setFaqItems(updated);
    const compiled = serializeFaqItems(updated, businessName);
    setFileContent(compiled);
  };

  const handleAddFaq = () => {
    const newFaq = {
      id: Date.now(),
      question: '',
      answer: '',
    };
    const updated = [...faqItems, newFaq];
    setFaqItems(updated);
    const compiled = serializeFaqItems(updated, businessName);
    setFileContent(compiled);
  };

  const handleDeleteFaq = (id) => {
    const updated = faqItems.filter((faq) => faq.id !== id);
    setFaqItems(updated);
    const compiled = serializeFaqItems(updated, businessName);
    setFileContent(compiled);
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!activeFile || isSaving) return;
    setIsSaving(true);

    try {
      await api.updatePackFile(businessId, activeFile, fileContent);
      setPackFiles((prev) => ({
        ...prev,
        [activeFile]: fileContent,
      }));
      setToastMessage(`✓ ${activeFile} hot-reloaded!`);
      if (onFileSaved) onFileSaved(activeFile, fileContent);
      setTimeout(() => setToastMessage(''), 3500);
    } catch {
      setToastMessage('Error saving file');
      setTimeout(() => setToastMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const fileNames = Object.keys(packFiles);
  const isPricingFile = activeFile.includes('pricing') || activeFile.includes('menu') || activeFile.includes('listings');
  const isFaqFile = activeFile.includes('faq');

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Knowledge Pack: {businessName}</h3>
            <p>Modify business facts, pricing, or rules. Gemma AI hot-reloads these instantly without server restarts.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Visual vs Markdown Mode Switcher */}
            <div className="mode-toggle-pill">
              <button
                type="button"
                className={`mode-toggle-btn ${editorMode === 'visual' ? 'active' : ''}`}
                onClick={() => setEditorMode('visual')}
                title="Easy structured form fields (No markdown syntax needed)"
              >
                📋 Visual Form Editor
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${editorMode === 'code' ? 'active' : ''}`}
                onClick={() => setEditorMode('code')}
                title="Direct raw Markdown code (.md)"
              >
                📄 Raw Markdown (.md)
              </button>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Close editor">
              ✕
            </button>
          </div>
        </div>

        {/* Tab Bar (Files in the Pack) */}
        <div className="modal-tabs-bar">
          {fileNames.map((fileName) => (
            <button
              key={fileName}
              className={`tab-btn ${activeFile === fileName ? 'active' : ''}`}
              onClick={() => handleTabClick(fileName)}
            >
              📄 {fileName}
            </button>
          ))}
        </div>

        {/* Editor Body */}
        <div className="modal-editor-body">
          {isLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading pack files from server...
            </div>
          ) : editorMode === 'visual' && isPricingFile ? (
            /* ================= VISUAL FORM: PRICING & PRODUCTS ================= */
            <div className="interactive-catalog-builder">
              <div style={{ marginBottom: '12px' }}>
                <span className="wizard-badge">Structured Form Builder</span>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Edit prices and items in simple fields. Our engine formats the Markdown file automatically.
                </p>
              </div>

              <div className="builder-items-list" style={{ maxHeight: '420px' }}>
                {pricingItems.map((item, index) => (
                  <div key={item.id} className="catalog-item-row-card">
                    <span className="item-row-index">#{index + 1}</span>
                    <div className="catalog-row-fields">
                      <div className="field-subrow">
                        <div className="form-group flex-2">
                          <label className="field-tiny-label">Item / Service Name</label>
                          <input
                            type="text"
                            className="form-input input-compact"
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            placeholder="e.g. Belgian Chocolate Truffle Cake"
                          />
                        </div>
                        <div className="form-group flex-1">
                          <label className="field-tiny-label">Price / Rate</label>
                          <input
                            type="text"
                            className="form-input input-compact"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                            placeholder="e.g. $35.00"
                          />
                        </div>
                        <div className="form-group flex-1">
                          <label className="field-tiny-label">Category</label>
                          <input
                            type="text"
                            className="form-input input-compact"
                            value={item.category}
                            onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                            placeholder="e.g. Cakes, Breads"
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="field-tiny-label">Description / Ingredients / Notice</label>
                        <input
                          type="text"
                          className="form-input input-compact"
                          value={item.details}
                          onChange={(e) => handleUpdateItem(item.id, 'details', e.target.value)}
                          placeholder="e.g. Rich dark chocolate ganache; requires 24h notice"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-delete-row"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="builder-actions-bar" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-add-item-dashed"
                  onClick={handleAddItem}
                >
                  ➕ Add Another Item / Product
                </button>
              </div>
            </div>
          ) : editorMode === 'visual' && isFaqFile ? (
            /* ================= VISUAL FORM: FAQS ================= */
            <div className="interactive-faq-builder">
              <div style={{ marginBottom: '12px' }}>
                <span className="wizard-badge">Structured FAQ Builder</span>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Add common customer questions and company answers. No markdown syntax or ** required!
                </p>
              </div>

              <div className="faqs-list-stack" style={{ maxHeight: '420px' }}>
                {faqItems.map((faq, index) => (
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
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(faq.id, 'question', e.target.value)}
                        placeholder="e.g. Do you offer delivery?"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="field-tiny-label">Verified Business Answer</label>
                      <textarea
                        className="form-input"
                        style={{ height: '60px', resize: 'vertical' }}
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(faq.id, 'answer', e.target.value)}
                        placeholder="State your policy clearly..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="builder-actions-bar" style={{ marginTop: '12px' }}>
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
            /* ================= RAW CODE / TEXTAREA EDITOR ================= */
            <div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Viewing raw file: <strong>{activeFile}</strong>
                </span>
                <span style={{ fontSize: '0.775rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  UTF-8 Markdown File
                </span>
              </div>
              <textarea
                className="code-editor-textarea"
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  syncVisualState(activeFile, e.target.value);
                }}
                placeholder="Markdown knowledge file content..."
                spellCheck="false"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="hot-reload-tip">
            ⚡ <strong>Hot-Reload:</strong> Grounding updates immediately on your next question without server restart.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {toastMessage && <span className="toast-feedback">{toastMessage}</span>}
            <button
              className="btn-header btn-header-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Close
            </button>
            <button
              className="btn-header btn-header-primary"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : '💾 Save & Hot-Reload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
