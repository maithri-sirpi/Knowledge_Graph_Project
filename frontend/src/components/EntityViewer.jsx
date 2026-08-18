import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import stringHash from 'string-hash';

export default function EntityViewer({ entities }) {
  const [search, setSearch] = useState('');

  const filteredEntities = entities.filter(entity => 
    entity.name.toLowerCase().includes(search.toLowerCase()) || 
    entity.type.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic color generation palette for badges
  const dynamicPalettes = [
    { bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: 'rgba(59, 130, 246, 0.2)' }, // Blue
    { bg: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: 'rgba(16, 185, 129, 0.2)' }, // Emerald
    { bg: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: 'rgba(139, 92, 246, 0.2)' }, // Violet
    { bg: 'rgba(244, 63, 94, 0.15)', color: '#fda4af', border: 'rgba(244, 63, 94, 0.2)' }, // Rose
    { bg: 'rgba(245, 158, 11, 0.15)', color: '#fde047', border: 'rgba(245, 158, 11, 0.2)' }, // Amber
    { bg: 'rgba(20, 184, 166, 0.15)', color: '#5eead4', border: 'rgba(20, 184, 166, 0.2)' }, // Teal
    { bg: 'rgba(217, 70, 239, 0.15)', color: '#f0abfc', border: 'rgba(217, 70, 239, 0.2)' }, // Fuchsia
    { bg: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.2)' }, // Indigo
    { bg: 'rgba(132, 204, 22, 0.15)', color: '#bef264', border: 'rgba(132, 204, 22, 0.2)' }  // Lime
  ];

  const getBadgeStyle = (type) => {
    switch (type.toLowerCase()) {
      case 'person': return { className: 'badge-person' };
      case 'animal': return { className: 'badge-animal' };
      case 'place': return { className: 'badge-place' };
      case 'object': return { className: 'badge-object' };
      case 'event': return { className: 'badge-event' };
      case 'unknown': return { className: 'badge-unknown' };
      default:
        const hash = stringHash(type || 'Unknown');
        const palette = dynamicPalettes[hash % dynamicPalettes.length];
        return { 
          style: { 
            background: palette.bg, 
            color: palette.color, 
            border: `1px solid ${palette.border}` 
          } 
        };
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Entity Viewer ({filteredEntities.length})</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>List of extracted Kannada entities mapped to their respective classes.</p>
        </div>
        
        <div className="search-bar" style={{ margin: 0, width: '300px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search entities or types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredEntities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <Info size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>{entities.length === 0 ? 'No entities extracted yet. Process a story first!' : 'No entities match your search.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
          {filteredEntities.map((entity, idx) => (
            <div 
              key={idx} 
              className="glass-card" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '12px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              <div 
                style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: '600', 
                  color: '#fff',
                  fontFamily: "'Noto Sans Kannada', sans-serif"
                }}
              >
                {entity.name}
              </div>
              {entity.aliases && entity.aliases.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Aliases: {entity.aliases.join(', ')}
                </div>
              )}
              <span 
                className={`badge ${getBadgeStyle(entity.type).className || ''}`}
                style={getBadgeStyle(entity.type).style || {}}
              >
                {entity.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
