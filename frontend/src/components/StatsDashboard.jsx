import React from 'react';
import { 
  FileText, 
  Users, 
  Share2, 
  Network, 
  Layers, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileCode, 
  Terminal
} from 'lucide-react';

export default function StatsDashboard({ stats, apiBaseUrl }) {
  const downloadFile = (endpoint, fileName) => {
    // Standard trigger download from API
    window.open(`${apiBaseUrl}/${endpoint}`, '_blank');
  };

  const statCards = [
    {
      title: 'Total Sentences',
      value: stats.total_sentences || 0,
      icon: <FileText size={24} style={{ color: '#3b82f6' }} />,
      bg: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.2)'
    },
    {
      title: 'Total Entities',
      value: stats.total_entities || 0,
      icon: <Users size={24} style={{ color: '#f43f5e' }} />,
      bg: 'rgba(244, 63, 94, 0.1)',
      borderColor: 'rgba(244, 63, 94, 0.2)'
    },
    {
      title: 'Total Relationships',
      value: stats.total_relationships || 0,
      icon: <Share2 size={24} style={{ color: '#8b5cf6' }} />,
      bg: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.2)'
    },
    {
      title: 'Unique Nodes (Neo4j)',
      value: stats.unique_nodes || 0,
      icon: <Layers size={24} style={{ color: '#06b6d4' }} />,
      bg: 'rgba(6, 182, 212, 0.1)',
      borderColor: 'rgba(6, 182, 212, 0.2)'
    },
    {
      title: 'Unique Edges (Neo4j)',
      value: stats.unique_edges || 0,
      icon: <Network size={24} style={{ color: '#10b981' }} />,
      bg: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.2)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2>Dashboard & Statistics</h2>
        <p className="subtitle" style={{ marginBottom: 0 }}>Metrics and exports for the current Kannada Knowledge Graph database.</p>
      </div>

      {/* Stats Widgets */}
      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div 
            key={idx} 
            className="stat-card" 
            style={{ 
              borderColor: card.borderColor
            }}
          >
            <div className="stat-icon-wrapper" style={{ backgroundColor: card.bg }}>
              {card.icon}
            </div>
            <div className="stat-info">
              <h4>{card.title}</h4>
              <p>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="glass-card">
        <h3>Export Options</h3>
        <p className="subtitle">Download the extracted Knowledge Graph structure in standard data formats.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {/* JSON Export */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileJson size={20} style={{ color: '#06b6d4' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>JSON Format</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Export nodes and edges as a flat JSON schema for visualizations.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => downloadFile('graph/json', 'knowledge_graph.json')}>
              <Download size={14} /> Download JSON
            </button>
          </div>

          {/* CSV Export */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>CSV Format</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Download semantic Subject-Predicate-Object relationships in CSV table layout.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => downloadFile('export/csv', 'knowledge_graph.csv')}>
              <Download size={14} /> Download CSV
            </button>
          </div>

          {/* Cypher Script Export */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={20} style={{ color: '#f59e0b' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Cypher Script</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Get a list of SQL-like Cypher statement lines to load directly in Neo4j browser.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => downloadFile('export/cypher', 'knowledge_graph.cypher')}>
              <Download size={14} /> Download Cypher
            </button>
          </div>

          {/* GraphML Export */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCode size={20} style={{ color: '#8b5cf6' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>GraphML</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Download XML structured graph markup for tools like Gephi or Cytoscape.
            </p>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => downloadFile('export/graphml', 'knowledge_graph.graphml')}>
              <Download size={14} /> Download GraphML
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
