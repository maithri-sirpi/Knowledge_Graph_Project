import React, { useState } from 'react';
import { Copy, Check, Table, Code, FileCode } from 'lucide-react';

export default function TripleViewer({ relationships }) {
  const [activeTab, setActiveTab] = useState('table');
  const [copied, setCopied] = useState(false);

  const formattedTriples = relationships.map(rel => ({
    subject: rel.subject,
    predicate: rel.predicate,
    object: rel.object
  }));

  const jsonString = JSON.stringify(formattedTriples, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Triple Viewer</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>Subject-Predicate-Object semantic representations of the stories.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn ${activeTab === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('table')}
            style={{ padding: '8px 16px' }}
          >
            <Table size={16} /> Table View
          </button>
          
          <button 
            className={`btn ${activeTab === 'json' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('json')}
            style={{ padding: '8px 16px' }}
          >
            <Code size={16} /> JSON View
          </button>
        </div>
      </div>

      {relationships.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <p>No triples generated yet. Upload and process a Kannada story first!</p>
        </div>
      ) : activeTab === 'table' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Predicate</th>
                <th>Object</th>
                <th>Confidence</th>
                <th>Source Evidence</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((rel, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '500', fontFamily: "'Noto Sans Kannada', sans-serif" }}>{rel.subject}</td>
                  <td>
                    <span style={{ color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {rel.predicate}
                    </span>
                  </td>
                  <td style={{ fontWeight: '500', fontFamily: "'Noto Sans Kannada', sans-serif" }}>{rel.object}</td>
                  <td>
                    {rel.confidence ? `${Math.round(rel.confidence * 100)}%` : 'N/A'}
                    {rel.uncertain && <span style={{ color: '#fbbf24', marginLeft: '6px', fontSize: '0.75rem' }}>(Uncertain)</span>}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: "'Noto Sans Kannada', sans-serif" }}>
                    {rel.source_text ? `"${rel.source_text}"` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px 12px', fontSize: '0.8rem' }}
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: '#10b981' }} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy JSON
              </>
            )}
          </button>
          <pre 
            style={{
              background: 'rgba(10, 15, 30, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              padding: '20px',
              color: '#34d399',
              fontSize: '0.9rem',
              overflowX: 'auto',
              maxHeight: '450px',
              fontFamily: "'Courier New', Courier, monospace",
              margin: 0
            }}
          >
            <code>{jsonString}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
