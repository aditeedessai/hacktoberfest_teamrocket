import React from 'react';

export default function BusinessSelector({ businesses, selectedBusiness, onChange }) {
  return (
    <div className="selector-wrapper" title="Switch active business skill pack">
      <span className="selector-label">Business:</span>
      <select
        id="business-select"
        className="business-dropdown"
        value={selectedBusiness}
        onChange={(e) => onChange(e.target.value)}
      >
        {businesses.map((biz) => (
          <option key={biz.business_id} value={biz.business_id}>
            {biz.name} ({biz.category.split('&')[0].trim()})
          </option>
        ))}
      </select>
    </div>
  );
}
