import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database, Search, Sparkles, RefreshCw, Terminal, CheckCircle } from 'lucide-react';
import stringHash from 'string-hash';
import dagre from 'dagre';

function GraphViewerInner({ graphData, apiBaseUrl, onRefreshStats }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState(''); // 'idle', 'syncing', 'success', 'error'
  const [cypherQueries, setCypherQueries] = useState([]);
  const [showQueries, setShowQueries] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const { fitView } = useReactFlow();

  // Standard fixed colors for standard categories
  const standardColors = {
    person: { bg: 'linear-gradient(135deg, #be123c, #f43f5e)', color: '#f43f5e' },
    animal: { bg: 'linear-gradient(135deg, #b45309, #f59e0b)', color: '#f59e0b' },
    place: { bg: 'linear-gradient(135deg, #047857, #10b981)', color: '#10b981' },
    location: { bg: 'linear-gradient(135deg, #047857, #10b981)', color: '#10b981' },
    object: { bg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#3b82f6' },
    event: { bg: 'linear-gradient(135deg, #6d28d9, #8b5cf6)', color: '#8b5cf6' },
    unknown: { bg: 'linear-gradient(135deg, #374151, #6b7280)', color: '#6b7280' },
    entity: { bg: 'linear-gradient(135deg, #374151, #6b7280)', color: '#6b7280' }
  };

  // Distinct palette colors for custom dynamically-extracted categories
  const dynamicPalettes = [
    { bg: 'linear-gradient(135deg, #0f766e, #14b8a6)', color: '#14b8a6' }, // Teal
    { bg: 'linear-gradient(135deg, #581c87, #d946ef)', color: '#d946ef' }, // Fuchsia
    { bg: 'linear-gradient(135deg, #1e3a8a, #6366f1)', color: '#6366f1' }, // Indigo
    { bg: 'linear-gradient(135deg, #3f6212, #84cc16)', color: '#84cc16' }, // Lime
    { bg: 'linear-gradient(135deg, #0284c7, #38bdf8)', color: '#38bdf8' }, // Sky Blue
    { bg: 'linear-gradient(135deg, #7c2d12, #ff7849)', color: '#ff7849' }  // Coral
  ];

  // 1. Compute all unique categories currently in the graph
  const uniqueTypes = React.useMemo(() => {
    if (!graphData || !graphData.nodes) return [];
    const typesSet = new Set();
    graphData.nodes.forEach(n => {
      if (n.type) {
        typesSet.add(n.type.trim());
      }
    });
    return Array.from(typesSet);
  }, [graphData]);

  // 2. Generate a custom type-to-color style mapping dynamically
  const typeStyles = React.useMemo(() => {
    const mapping = {};
    let customTypeIndex = 0;

    uniqueTypes.forEach(rawType => {
      const cleanType = rawType.toLowerCase();
      if (standardColors[cleanType]) {
        mapping[rawType] = standardColors[cleanType];
      } else {
        const palette = dynamicPalettes[customTypeIndex % dynamicPalettes.length];
        mapping[rawType] = palette;
        customTypeIndex++;
      }
    });

    return mapping;
  }, [uniqueTypes]);

  const getStyleForType = (type) => {
    if (typeStyles[type]) {
      return { background: typeStyles[type].bg, borderColor: typeStyles[type].color };
    }
    return { background: 'linear-gradient(135deg, #374151, #6b7280)' };
  };

  // Re-generate nodes and edges when data updates
  useEffect(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Standard node dimensions
    const nodeWidth = 150;
    const nodeHeight = 50;

    dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranksep: 120, nodesep: 60 });

    const formattedNodes = graphData.nodes.map((node) => {
      const typeStyle = getStyleForType(node.type);

      return {
        id: node.id,
        type: 'default',
        data: { label: `${node.label} (${node.type})` },
        position: { x: 0, y: 0 },
        style: {
          ...typeStyle,
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          color: '#fff',
          padding: '10px 18px',
          fontWeight: '600',
          fontSize: '0.85rem',
          fontFamily: "'Noto Sans Kannada', 'Outfit', sans-serif",
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          minWidth: '120px'
        }
      };
    });

    formattedNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    const formattedEdges = graphData.links.map((link, index) => ({
      id: `e-${index}`,
      source: link.source,
      target: link.target,
      label: link.type,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: '#6b7280'
      },
      style: {
        stroke: '#4b5563',
        strokeWidth: 2
      }
    }));

    formattedEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    formattedNodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.position = {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2
      };
    });

    setNodes(formattedNodes);
    setEdges(formattedEdges);

    // Call fitView after layout
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 800 });
    });
  }, [graphData, setNodes, setEdges, fitView]);

  // Node search highlights matching nodes
  const handleSearch = () => {
    setNodes((nds) => nds.map((node) => {
      const isMatch = searchQuery && node.id.toLowerCase().includes(searchQuery.toLowerCase());
      const styleCopy = { ...node.style };
      
      if (isMatch) {
        styleCopy.border = '3px solid #60a5fa';
        styleCopy.boxShadow = '0 0 20px #3b82f6';
      } else {
        styleCopy.border = '2px solid rgba(255, 255, 255, 0.2)';
        styleCopy.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
      }

      return {
        ...node,
        style: styleCopy
      };
    }));
  };

  const handleNodeClick = useCallback((event, node) => {
    const rawNode = graphData.nodes.find(n => n.id === node.id);
    setSelectedNode(rawNode);
  }, [graphData]);

  // Sync state and queries with Neo4j DB
  const handleSyncNeo4j = async () => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      setSyncStatus('error');
      setCypherQueries(["Error: No graph data extracted to sync. Process a story first."]);
      return;
    }

    setSyncStatus('syncing');
    setCypherQueries([]);

    // Translate React Flow structure back to raw arrays
    const entities = graphData.nodes.map(n => ({ name: n.id, type: n.type }));
    const relationships = graphData.links.map(l => ({ subject: l.source, predicate: l.type, object: l.target }));

    try {
      const res = await fetch(`${apiBaseUrl}/graph`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entities, relationships })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to sync graph with Neo4j.');
      }

      const data = await res.json();
      setSyncStatus('success');
      setCypherQueries(data.queries || []);
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setCypherQueries([`Error: ${err.message}`]);
    }
  };

  return (
    <div className="layout-split" style={{ gridTemplateColumns: '2fr 1fr' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Knowledge Graph Viewer</h2>
            <p className="subtitle" style={{ marginBottom: 0 }}>Interactive visual representation. Zoom & Drag to navigate.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="search-bar" style={{ margin: 0 }}>
              <input
                type="text"
                className="input-field"
                style={{ width: '180px', padding: '8px 12px' }}
                placeholder="Find node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={handleSearch}>
                <Search size={14} />
              </button>
            </div>

            <button 
              className="btn btn-primary"
              style={{ padding: '8px 16px' }}
              onClick={handleSyncNeo4j}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw size={14} className="spinner" /> Syncing...
                </>
              ) : (
                <>
                  <Database size={14} /> Neo4j Sync
                </>
              )}
            </button>
          </div>
        </div>

        {nodes.length === 0 ? (
          <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090c15', border: '1px dashed var(--border-glass)', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
            <p>No graph nodes parsed yet. Submit a story first!</p>
          </div>
        ) : (
          <div className="graph-canvas-container" style={{ height: '500px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
              minZoom={0.05}
              maxZoom={4}
            >
              <Background color="#1e293b" gap={16} size={1} />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Node Detail Viewer */}
        <div className="glass-card">
          <h3>Node Inspector</h3>
          <p className="subtitle">Click on a node in the graph to view details.</p>
          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Kannada Label</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', fontFamily: "'Noto Sans Kannada', sans-serif", marginTop: '4px' }}>
                  {selectedNode.label}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Entity Type</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge badge-${selectedNode.type.toLowerCase()}`}>
                    {selectedNode.type}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No node selected</p>
          )}
        </div>

        {/* Dynamic Legend */}
        <div className="glass-card">
          <h3>Legend</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {Object.keys(typeStyles).map(type => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: typeStyles[type].bg 
                }}></span>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'capitalize' }}>
                  {type.toLowerCase()}
                </span>
              </div>
            ))}
            {Object.keys(typeStyles).length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No categories to display</p>
            )}
          </div>
        </div>

        {/* Sync Queries Output */}
        {syncStatus && syncStatus !== 'idle' && (
          <div className="glass-card" style={{ borderLeft: `4px solid ${syncStatus === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {syncStatus === 'success' ? (
                  <CheckCircle size={16} style={{ color: 'var(--accent-emerald)' }} />
                ) : syncStatus === 'error' ? (
                  <Terminal size={16} style={{ color: 'var(--accent-rose)' }} />
                ) : (
                  <RefreshCw size={16} className="spinner" style={{ color: 'var(--accent-blue)' }} />
                )}
                <span style={{ fontWeight: 'bold' }}>
                  {syncStatus === 'success' ? 'Graph Synced!' : syncStatus === 'error' ? 'Sync Failed' : 'Syncing Neo4j...'}
                </span>
              </div>
              
              {cypherQueries.length > 0 && (
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => setShowQueries(!showQueries)}
                >
                  {showQueries ? 'Hide Queries' : 'Show Cypher'}
                </button>
              )}
            </div>

            {showQueries && cypherQueries.length > 0 && (
              <pre 
                style={{ 
                  marginTop: '12px',
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem',
                  color: '#60a5fa',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontFamily: 'monospace'
                }}
              >
                {cypherQueries.join('\n')}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GraphViewer(props) {
  return (
    <ReactFlowProvider>
      <GraphViewerInner {...props} />
    </ReactFlowProvider>
  );
}
