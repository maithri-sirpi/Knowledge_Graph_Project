import React, { useState } from 'react';
import { 
  History, 
  Eye, 
  Trash2, 
  Search, 
  Clock, 
  Layers, 
  Share2, 
  FileText, 
  Network, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  ArrowRight
} from 'lucide-react';

export default function HistoryViewer({ 
  history = [], 
  onSelectHistoryItem, 
  onDeleteHistoryItem, 
  onClearHistory,
  onNavigateToUpload 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(term);
    const storyMatch = item.story?.toLowerCase().includes(term);
    const dateMatch = item.timestamp?.toLowerCase().includes(term);
    return titleMatch || storyMatch || dateMatch;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={24} style={{ color: '#60a5fa' }} />
              <h2 style={{ margin: 0 }}>Story History & Upload Log</h2>
              <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '0.85rem' }}>
                {history.length} Saved
              </span>
            </div>
            <p className="subtitle" style={{ margin: '6px 0 0 0', fontSize: '0.95rem' }}>
              Browse previously uploaded Kannada stories, view their extracted knowledge graphs, and inspect parameters.
            </p>
          </div>

          {history.length > 0 && (
            <button className="btn btn-danger" onClick={onClearHistory}>
              <Trash2 size={16} /> Clear All History
            </button>
          )}
        </div>

        {/* Search filter */}
        {history.length > 0 && (
          <div className="search-bar" style={{ margin: 0 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '40px' }}
                placeholder="Search history by story text, title, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', marginBottom: '20px' }}>
            <History size={48} style={{ color: '#60a5fa', opacity: 0.6 }} />
          </div>
          <h3>No Story History Found</h3>
          <p className="subtitle" style={{ maxWidth: '480px', margin: '8px auto 24px auto' }}>
            Upload and process a Kannada story to automatically save its graph here for instant viewing anytime.
          </p>
          <button className="btn btn-primary" onClick={onNavigateToUpload}>
            <Sparkles size={16} /> Upload & Extract Story <ArrowRight size={16} />
          </button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>No history items matching "{searchTerm}"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredHistory.map((item) => {
            const isExpanded = expandedId === item.id;
            const entityCount = item.stats?.total_entities || item.extractedData?.entities?.length || 0;
            const relCount = item.stats?.total_relationships || item.extractedData?.relationships?.length || 0;
            const sentenceCount = item.stats?.total_sentences || item.extractedData?.sentences?.length || 0;

            return (
              <div key={item.id} className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  {/* Info Header */}
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px' }}>
                        <Clock size={12} /> {item.timestamp}
                      </span>
                      {item.llmProvider && (
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', background: 'rgba(139,92,246,0.15)', color: '#c084fc' }}>
                          {item.llmProvider}
                        </span>
                      )}
                    </div>

                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', color: '#fff', lineHeight: '1.4' }}>
                      {item.title || 'Kannada Story'}
                    </h3>

                    {/* Stats badges */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
                      <span className="badge" style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.2)', textTransform: 'none' }}>
                        <Layers size={13} style={{ marginRight: '4px' }} /> {entityCount} Entities
                      </span>
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'none' }}>
                        <Share2 size={13} style={{ marginRight: '4px' }} /> {relCount} Relationships
                      </span>
                      <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)', textTransform: 'none' }}>
                        <FileText size={13} style={{ marginRight: '4px' }} /> {sentenceCount} Sentences
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => onSelectHistoryItem(item)}
                      style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                    >
                      <Network size={16} /> View Graph
                    </button>

                    <button 
                      className="btn btn-secondary"
                      onClick={() => toggleExpand(item.id)}
                      style={{ padding: '10px 14px' }}
                      title={isExpanded ? "Collapse Story Text" : "Expand Story Text"}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span style={{ fontSize: '0.85rem' }}>{isExpanded ? 'Hide' : 'Read'}</span>
                    </button>

                    <button 
                      className="btn btn-danger"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      style={{ padding: '10px 12px' }}
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Story Text */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Full Story Text
                    </h4>
                    <div style={{ 
                      background: 'rgba(9, 12, 21, 0.7)', 
                      padding: '14px 16px', 
                      borderRadius: '8px', 
                      whiteSpace: 'pre-wrap', 
                      lineHeight: '1.6', 
                      maxHeight: '260px', 
                      overflowY: 'auto',
                      fontSize: '0.95rem',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {item.story || 'No raw story text saved.'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
