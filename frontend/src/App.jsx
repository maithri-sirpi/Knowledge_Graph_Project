import React, { useState, useEffect } from 'react';
import { 
  Home, 
  UploadCloud, 
  Layers, 
  Share2, 
  TableProperties, 
  Network, 
  BarChart3,
  Server,
  Sparkles,
  Database,
  History
} from 'lucide-react';

import StoryUpload from './components/StoryUpload';
import EntityViewer from './components/EntityViewer';
import RelationshipViewer from './components/RelationshipViewer';
import TripleViewer from './components/TripleViewer';
import GraphViewer from './components/GraphViewer';
import StatsDashboard from './components/StatsDashboard';
import HistoryViewer from './components/HistoryViewer';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [extractedData, setExtractedData] = useState({
    sentences: [],
    entities: [],
    relationships: [],
    triples: []
  });
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [stats, setStats] = useState({
    total_sentences: 0,
    total_entities: 0,
    total_relationships: 0,
    unique_nodes: 0,
    unique_edges: 0
  });
  const [isProcessingStory, setIsProcessingStory] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('kannada_kg_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      return [];
    }
  });

  // Check backend and Neo4j connectivity
  const checkConnection = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/`);
      if (res.ok) {
        const data = await res.json();
        setDbConnected(data.neo4j_connected);
      } else {
        setDbConnected(false);
      }
    } catch (err) {
      console.error("Backend offline:", err);
      setDbConnected(false);
    }
  };

  // Fetch updated graph stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/statistics`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  // Fetch graph nodes & links for visualizer
  const fetchGraphData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/graph/json`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error("Error fetching graph JSON:", err);
    }
  };

  useEffect(() => {
    checkConnection();
    fetchStats();
    fetchGraphData();
    
    // Poll connection status every 10 seconds
    const interval = setInterval(() => {
      checkConnection();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleExtracted = (data, storyText, llmProvider) => {
    setExtractedData(data);
    
    // Convert extracted data straight to temporary nodes and links for display 
    // before the user decides to sync with Neo4j
    const nodes = data.entities.map(e => ({ id: e.name, label: e.name, type: e.type }));
    const links = data.relationships.map(r => ({ source: r.subject, target: r.object, type: r.predicate }));
    const newGraphData = { nodes, links };
    setGraphData(newGraphData);

    // Update local stats display
    const uniqueNodes = new Set(data.entities.map(e => e.name)).size;
    const computedStats = {
      total_sentences: data.sentences.length,
      total_entities: data.entities.length,
      total_relationships: data.relationships.length,
      unique_nodes: uniqueNodes,
      unique_edges: data.relationships.length
    };
    setStats(computedStats);

    // Save item to history
    if (storyText) {
      const firstLine = storyText.split('\n')[0].trim() || 'Kannada Story';
      const title = firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
      const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        title,
        story: storyText,
        llmProvider: llmProvider || 'gemini',
        extractedData: data,
        graphData: newGraphData,
        stats: computedStats
      };

      setHistory(prev => {
        const updated = [historyItem, ...prev];
        try {
          localStorage.setItem('kannada_kg_history', JSON.stringify(updated));
        } catch (err) {
          console.error("Failed to save history to localStorage", err);
        }
        return updated;
      });
    }
    
    // Auto redirect to Graph viewer so they can see the draft graph
    setActiveTab('graph');
  };

  const handleSelectHistoryItem = (item) => {
    if (item.extractedData) {
      setExtractedData(item.extractedData);
    }
    if (item.graphData) {
      setGraphData(item.graphData);
    }
    if (item.stats) {
      setStats(item.stats);
    }
    setActiveTab('graph');
  };

  const handleDeleteHistoryItem = (id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('kannada_kg_history', JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to update history in localStorage", err);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all story history?")) {
      setHistory([]);
      localStorage.removeItem('kannada_kg_history');
    }
  };

  const refreshStats = () => {
    fetchStats();
    fetchGraphData();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="glass-card" style={{ padding: '40px 30px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
              <div style={{ display: 'inline-flex', padding: '16px', background: 'rgba(59,130,246,0.15)', borderRadius: '24px', marginBottom: '20px' }}>
                <Network size={48} style={{ color: '#60a5fa' }} />
              </div>
              <h1 style={{ fontSize: '2.5rem' }}>Kannada Story Knowledge Graph Generator</h1>
              <p className="subtitle" style={{ maxWidth: '600px', margin: '12px auto 24px auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Automatically process Kannada narratives, extract entities (Persons, Animals, Places) 
                and semantic relationships to build an interactive, downloadable Neo4j Knowledge Graph.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                  <UploadCloud size={16} /> Get Started - Upload Story
                </button>
                {history.length > 0 && (
                  <button className="btn btn-secondary" onClick={() => setActiveTab('history')}>
                    <History size={16} /> View History ({history.length})
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <Sparkles size={28} style={{ color: '#fbbf24', marginBottom: '16px' }} />
                <h3>1. NLP Extraction</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Sentence segmenter, tokenizes, and performs Named Entity Recognition (NER) on Kannada text. Supports both Rule-based extraction and Generative LLMs.
                </p>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <Database size={28} style={{ color: '#3b82f6', marginBottom: '16px' }} />
                <h3>2. Neo4j Graph Database</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Translates relationships into idempotent Cypher scripts to dynamically populate graph nodes and directed relationship edges.
                </p>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <Network size={28} style={{ color: '#10b981', marginBottom: '16px' }} />
                <h3>3. React Flow Visualizer</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Navigate nodes with zoom & pan controls. Filter entities by keyword, inspect element parameters, and download exports (JSON, CSV, GraphML).
                </p>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <HistoryViewer 
            history={history} 
            onSelectHistoryItem={handleSelectHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onNavigateToUpload={() => setActiveTab('upload')}
          />
        );
      case 'entities':
        return <EntityViewer entities={extractedData.entities} />;
      case 'relationships':
        return <RelationshipViewer relationships={extractedData.relationships} />;
      case 'triples':
        return <TripleViewer relationships={extractedData.relationships} />;
      case 'graph':
        return <GraphViewer graphData={graphData} apiBaseUrl={API_BASE_URL} onRefreshStats={refreshStats} />;
      case 'stats':
        return <StatsDashboard stats={stats} apiBaseUrl={API_BASE_URL} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <div className="sidebar">
        <div className="brand-section">
          <div className="brand-icon">
            <Network size={22} />
          </div>
          <div>
            <div className="brand-title">ಕನ್ನಡ Graph</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>KANNADA KG GENERATOR</div>
          </div>
        </div>

        <ul className="nav-list">
          <li>
            <button 
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Home size={18} /> Home
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UploadCloud size={18} /> Upload Story
              </span>
              {isProcessingStory && (
                <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
              )}
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <History size={18} /> Story History
              </span>
              {history.length > 0 && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {history.length}
                </span>
              )}
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'entities' ? 'active' : ''}`}
              onClick={() => setActiveTab('entities')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Layers size={18} /> Entity Viewer
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'relationships' ? 'active' : ''}`}
              onClick={() => setActiveTab('relationships')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Share2 size={18} /> Relationship Viewer
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'triples' ? 'active' : ''}`}
              onClick={() => setActiveTab('triples')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <TableProperties size={18} /> Triple Viewer
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'graph' ? 'active' : ''}`}
              onClick={() => setActiveTab('graph')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Network size={18} /> Knowledge Graph
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <BarChart3 size={18} /> Dashboard & Stats
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <Server size={14} />
          <span>Neo4j Connection:</span>
          <span className={`db-status ${dbConnected ? 'connected' : ''}`}></span>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: dbConnected ? 'var(--accent-emerald)' : 'var(--color-text-muted)' }}>
            {dbConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Main container */}
      <div className="main-content">
        {/* Background processing banner */}
        {isProcessingStory && (
          <div className="glass-card" style={{ 
            marginBottom: '20px', 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '14px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="spinner" style={{ width: '18px', height: '18px' }}></span>
              <div>
                <strong style={{ color: '#60a5fa' }}>Processing Kannada Story in Background...</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Extracting entities and relationships. You can freely navigate other sections—we will automatically open the Knowledge Graph once complete!
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => setActiveTab('upload')}>
              View Upload Status
            </button>
          </div>
        )}

        {/* Story Upload Component (kept mounted so state and async extraction request are preserved) */}
        <div style={{ display: activeTab === 'upload' ? 'block' : 'none' }}>
          <StoryUpload 
            onExtracted={handleExtracted} 
            apiBaseUrl={API_BASE_URL} 
            onLoadingChange={setIsProcessingStory}
          />
        </div>

        {/* Other Tab Views */}
        {activeTab !== 'upload' && renderContent()}
      </div>
    </div>
  );
}

