import React, { useState } from 'react';
import { Sparkles, FileText, ArrowRight, Play, AlertTriangle } from 'lucide-react';

const SAMPLE_KANNADA_STORY = `ಒಂದಾನೊಂದು ಕಾಲದಲ್ಲಿ ಒಂದು ದಟ್ಟವಾದ ಕಾಡು ಇತ್ತು.
ಆ ಕಾಡಿನಲ್ಲಿ ಒಂದು ಬಲಿಷ್ಠ ಸಿಂಹ ವಾಸಿಸುತ್ತಿತ್ತು.
ಎಲ್ಲ ಪ್ರಾಣಿಗಳು ಅದನ್ನು ಕಾಡಿನ ರಾಜ ಎಂದು ಗೌರವಿಸುತ್ತಿದ್ದವು.
ಸಿಂಹವು ಧೈರ್ಯಶಾಲಿಯಾಗಿತ್ತು.
ಅದು ನ್ಯಾಯವಾಗಿ ವರ್ತಿಸುತ್ತಿತ್ತು.
ಒಂದು ದಿನ ಸಿಂಹವು ದೊಡ್ಡ ಮರದ ಕೆಳಗೆ ವಿಶ್ರಾಂತಿ ಪಡೆಯುತ್ತಿತ್ತು.
ತಂಪಾದ ಗಾಳಿ ಬೀಸುತ್ತಿತ್ತು.
ಸಿಂಹವು ಗಾಢ ನಿದ್ರೆಗೆ ಜಾರಿತು.
ಅದೇ ಸಮಯದಲ್ಲಿ ಒಂದು ಚಿಕ್ಕ ಇಲಿ ಅಲ್ಲಿಗೆ ಬಂದಿತು.
ಅದು ತುಂಬಾ ಚುರುಕಾಗಿತ್ತು.
ಇಲಿ ಆಟವಾಡುತ್ತಾ ಓಡಾಡತೊಡಗಿತು.
ಅದು ಸಿಂಹದ ಬಾಲದ ಮೇಲೆ ಹತ್ತಿತು.
ನಂತರ ಅದರ ಬೆನ್ನಿನ ಮೇಲೆ ಓಡಿತು.
ಕೊನೆಗೆ ಅದರ ಮೂಗಿನ ಮೇಲೂ ಹತ್ತಿತು.
ಅಷ್ಟರಲ್ಲಿ ಸಿಂಹಕ್ಕೆ ಎಚ್ಚರವಾಯಿತು.
ಸಿಂಹವು ಕೋಪದಿಂದ ಕಣ್ಣು ತೆರೆದಿತು.
ತನ್ನ ದೊಡ್ಡ ಪಂಜದಿಂದ ಇಲಿಯನ್ನು ಹಿಡಿದುಕೊಂಡಿತು.
ಇಲಿ ತುಂಬಾ ಹೆದರಿತು.
ಅದು ನಡುಗತೊಡಗಿತು.
"ದಯವಿಟ್ಟು ನನ್ನನ್ನು ಬಿಡಿ" ಎಂದು ಇಲಿ ಬೇಡಿಕೊಂಡಿತು.
"ನಾನು ನಿಮಗೆ ಯಾವ ತೊಂದರೆಯನ್ನೂ ಕೊಡಲು ಬಯಸಲಿಲ್ಲ" ಎಂದು ಹೇಳಿತು.
"ಒಂದು ದಿನ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ" ಎಂದಿತು.
ಇಲಿಯ ಮಾತು ಕೇಳಿ ಸಿಂಹ ನಕ್ಕಿತು.
"ನಿನ್ನಂತಹ ಚಿಕ್ಕ ಪ್ರಾಣಿ ನನಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ?" ಎಂದು ಕೇಳಿತು.
ಆದರೂ ಸಿಂಹಕ್ಕೆ ಇಲಿಯ ಮೇಲೆ ಕರುಣೆ ಬಂತು.
ಅದು ಇಲಿಯನ್ನು ಬಿಡಿತು.
ಇಲಿ ಸಂತೋಷದಿಂದ ಅಲ್ಲಿಂದ ಓಡಿಹೋಯಿತು.
ದಿನಗಳು ಕಳೆಯತೊಡಗಿದವು.
ಒಂದು ದಿನ ಸಿಂಹವು ಬೇಟೆಗಾಗಿ ಕಾಡಿನಲ್ಲಿ ನಡೆಯುತ್ತಿತ್ತು.
ಅಲ್ಲೇ ಬೇಟೆಗಾರನು ಹಾಕಿದ್ದ ಬಲೆಗೆ ಅದು ಸಿಕ್ಕಿಬಿದ್ದಿತು.
ಸಿಂಹವು ಹೊರಬರಲು ಬಹಳ ಪ್ರಯತ್ನಿಸಿತು.
ಆದರೆ ಬಲೆ ತುಂಬಾ ಗಟ್ಟಿಯಾಗಿತ್ತು.
ಸಿಂಹವು ಜೋರಾಗಿ ಗರ್ಜಿಸತೊಡಗಿತು.
ಅದರ ಗರ್ಜನೆ ಕಾಡಿನಾದ್ಯಂತ ಕೇಳಿಸಿತು.
ಇಲಿಗೂ ಆ ಶಬ್ದ ಕೇಳಿಸಿತು.
ಇಲಿ ತಕ್ಷಣ ಆ ಕಡೆಗೆ ಓಡಿತು.
ಅದು ಸಿಂಹವನ್ನು ಬಲೆಯೊಳಗೆ ಕಂಡಿತು.
ಇಲಿಗೆ ಹಿಂದಿನ ಘಟನೆ ನೆನಪಾಯಿತು.
"ಈಗ ನಾನು ಸಹಾಯ ಮಾಡುವ ಸಮಯ ಬಂದಿದೆ" ಎಂದು ಯೋಚಿಸಿತು.
ಅದು ತನ್ನ ಚೂಪಾದ ಹಲ್ಲುಗಳಿಂದ ಬಲೆಯನ್ನು ಕಚ್ಚತೊಡಗಿತು.
ಸ್ವಲ್ಪ ಸ್ವಲ್ಪವಾಗಿ ಹಗ್ಗಗಳು ತುಂಡಾಗತೊಡಗಿದವು.
ಬಹಳ ಹೊತ್ತಿನ ನಂತರ ಬಲೆ ಹರಿದುಹೋಯಿತು.
ಸಿಂಹವು ನಿಧಾನವಾಗಿ ಹೊರಬಂದಿತು.
ಅದು ಬಹಳ ಸಂತೋಷಪಟ್ಟಿತು.
ಸಿಂಹವು ಇಲಿಗೆ ಹೃತ್ಪೂರ್ವಕ ಧನ್ಯವಾದ ಹೇಳಿತು.
"ನೀನು ನಿಜವಾದ ಸ್ನೇಹಿತ" ಎಂದು ಹೇಳಿತು.
ಇಲಿ ವಿನಯದಿಂದ ನಗಿತು.
"ಸಹಾಯ ಮಾಡುವ ಅವಕಾಶ ಸಿಕ್ಕದ್ದಕ್ಕೆ ನನಗೆ ಸಂತೋಷ" ಎಂದಿತು.
ಆ ದಿನದಿಂದ ಸಿಂಹ ಮತ್ತು ಇಲಿ ಒಳ್ಳೆಯ ಸ್ನೇಹಿತರಾದರು.
ಅವರು ಒಬ್ಬರನ್ನೊಬ್ಬರು ಗೌರವಿಸುತ್ತಿದ್ದರು.
ಕಾಡಿನ ಎಲ್ಲಾ ಪ್ರಾಣಿಗಳು ಅವರ ಸ್ನೇಹವನ್ನು ಮೆಚ್ಚಿದವು.
ಸಣ್ಣವರನ್ನು ಎಂದಿಗೂ ತಿರಸ್ಕರಿಸಬಾರದು ಎಂಬ ಪಾಠ ಎಲ್ಲರಿಗೂ ತಿಳಿಯಿತು.
ಒಳ್ಳೆಯ ಮನಸ್ಸು ಯಾವಾಗಲೂ ದೊಡ್ಡ ಶಕ್ತಿಯಾಗಿರುತ್ತದೆ ಎಂಬುದು ಎಲ್ಲರಿಗೂ ಅರ್ಥವಾಯಿತು.
ಆ ನಂತರ ಅವರು ಕಾಡಿನಲ್ಲಿ ಸಂತೋಷದಿಂದ ಜೀವನ ನಡೆಸಿದರು.
ನೀತಿ: ಸಣ್ಣ ಸಹಾಯವೂ ದೊಡ್ಡ ಉಪಕಾರವಾಗಬಹುದು. ಒಳ್ಳೆಯತನ ಮತ್ತು ದಯೆ ಎಂದಿಗೂ ವ್ಯರ್ಥವಾಗುವುದಿಲ್ಲ.`;

export default function StoryUpload({ onExtracted, apiBaseUrl }) {
  const [story, setStory] = useState('');
  const [useLlm, setUseLlm] = useState(true);
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentences, setSentences] = useState([]);

  const handleLoadSample = () => {
    setStory(SAMPLE_KANNADA_STORY);
    setError('');
  };

  const handleExtract = async () => {
    if (!story.trim()) {
      setError('Please paste or write a Kannada story first.');
      return;
    }

    setLoading(true);
    setError('');
    setSentences([]);

    try {
      const response = await fetch(`${apiBaseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: story,
          use_llm: useLlm,
          llm_provider: llmProvider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract data: ${response.statusText}`);
      }

      const data = await response.json();
      setSentences(data.sentences);
      onExtracted(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during extraction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-split">
      <div className="glass-card">
        <h2>Enter Kannada Story</h2>
        <p className="subtitle">Paste your Kannada text below to generate the knowledge graph.</p>
        
        <div style={{ marginBottom: '20px' }}>
          <textarea
            className="text-area"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="ಇಲ್ಲಿ ಕನ್ನಡ ಕಥೆಯನ್ನು ಬರೆಯಿರಿ ಅಥವಾ ಪೇಸ್ಟ್ ಮಾಡಿ..."
          />
        </div>

        <div className="options-row">
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn btn-secondary" onClick={handleLoadSample}>
              <FileText size={16} /> Load Sample Story
            </button>
            
            <button className="btn btn-secondary" onClick={() => setStory('')}>
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>LLM Provider:</span>
            <select
              className="input-field"
              style={{ width: '120px', padding: '6px 12px' }}
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
            >
              <option value="gemini">Gemini API</option>
              <option value="openai">OpenAI GPT</option>
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={handleExtract}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }}></span>
              Extracting Kannada Story Elements...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Process & Generate Triples <ArrowRight size={16} />
            </>
          )}
        </button>

        {error && (
          <div className="glass-card" style={{ marginTop: '20px', background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#fda4af' }}>
            {error}
          </div>
        )}
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2>Segmented Sentences ({sentences.length})</h2>
        <p className="subtitle">The story is automatically split into sentences below.</p>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '420px' }}>
          {sentences.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', minHeight: '200px' }}>
              <Play size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Process a story to see segmented sentences</p>
            </div>
          ) : (
            <ul className="sentence-list">
              {sentences.map((segment, idx) => (
                <li key={idx} className="sentence-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', marginRight: '10px', fontSize: '0.85rem' }}>#{idx + 1}</span>
                    {segment.text}
                  </div>
                  {(segment.section || segment.verse_number || (segment.source_type && segment.source_type !== 'unknown')) && (
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '25px' }}>
                      {segment.section && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: '4px' }}>{segment.section}</span>}
                      {segment.verse_number && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', borderRadius: '4px' }}>Verse: {segment.verse_number}</span>}
                      {segment.source_type && segment.source_type !== 'unknown' && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '4px' }}>{segment.source_type}</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
