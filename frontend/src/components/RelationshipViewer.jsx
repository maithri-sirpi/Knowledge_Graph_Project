import React, { useState } from 'react';
import { ArrowRight, Search, Info } from 'lucide-react';

export default function RelationshipViewer({ relationships }) {
  const [search, setSearch] = useState('');

  const filteredRels = relationships.filter(rel => 
    rel.subject.toLowerCase().includes(search.toLowerCase()) ||
    rel.predicate.toLowerCase().includes(search.toLowerCase()) ||
    rel.object.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Relationship Viewer ({filteredRels.length})</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>View the directed connections connecting the story entities.</p>
        </div>
        
        <div className="search-bar" style={{ margin: 0, width: '300px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredRels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <Info size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>{relationships.length === 0 ? 'No connections extracted yet. Process a story first!' : 'No relationships match your search.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredRels.map((rel, idx) => (
            <div key={idx}>
              <div 
                className="glass-card" 
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                {/* Subject */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff', fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                    {rel.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Subject</span>
                </div>

                {/* Arrow + Predicate */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, padding: '0 12px' }}>
                  <span 
                    style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      color: '#60a5fa', 
                      background: 'rgba(59, 130, 246, 0.1)', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}
                  >
                    {rel.predicate}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <div style={{ height: '2px', background: 'rgba(255,255,255,0.1)', flexGrow: 1 }}></div>
                    <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '-2px' }} />
                  </div>
                </div>

                {/* Object */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#fff', fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                    {rel.object}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Object</span>
                </div>
              </div>
            
              {(rel.source_text || rel.confidence) && (
                <div style={{ padding: '8px 16px', marginTop: '12px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {rel.confidence && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span>Confidence: {Math.round(rel.confidence * 100)}%</span>
                      {rel.uncertain && <span style={{ color: '#fbbf24', fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(251,191,36,0.1)', borderRadius: '4px' }}>Uncertain</span>}
                    </div>
                  )}
                  {rel.source_text && (
                    <div style={{ fontStyle: 'italic', fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                      "{rel.source_text}"
                      {rel.source_location && <span style={{ color: '#a78bfa', marginLeft: '6px' }}>({rel.source_location})</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
