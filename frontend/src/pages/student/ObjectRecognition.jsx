import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiApi } from '../../services/aiApi';

export default function ObjectRecognition() {
  const [mode, setMode] = useState('Learn Mode');
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState({
    object: 'Notebook / Book',
    emoji: '📓',
    confidence: 97,
    description: 'A portable pad of paper for school work and taking down learning notes.',
    signInstructions: 'Clasp palms flat together, then pivot them open at the wrist like opening book pages.',
  });
  const [recentObjects, setRecentObjects] = useState(['Notebook', 'Computer', 'Pencil', 'Water Bottle']);

  const handleScanObject = async () => {
    setScanning(true);
    try {
      const res = await aiApi.predictObject({ mode });
      if (res?.prediction) {
        setDetected({
          object: res.prediction.object || 'Notebook / Book',
          emoji: res.prediction.emoji || '📓',
          confidence: Math.round((res.prediction.confidence || 0.95) * 100),
          description: res.prediction.description || 'Classroom object detected through computer vision.',
          signInstructions: res.prediction.signInstructions || 'Clasp palms together, then pivot open at wrist.',
        });
        if (res.prediction.object && !recentObjects.includes(res.prediction.object)) {
          setRecentObjects((prev) => [res.prediction.object, ...prev.slice(0, 5)]);
        }
      }
    } catch (err) {
      alert(err.message || 'Object recognition failed.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div>
            <h1>Interactive Object Identifier</h1>
            <p>Point the camera at any item to discover its sign and test yourself.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            <span className="text-secondary" style={{ fontSize: 13 }}>Vision Engine: AI Vision V1</span>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="filter-tabs mb-4">
          {['Learn Mode', 'Translate Mode'].map((m) => (
            <button
              key={m}
              className={`filter-tab ${mode === m ? 'active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="row g-4">
          {/* Camera Feed */}
          <div className="col-lg-7">
            <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                className="video-container"
                style={{ minHeight: 380, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
              >
                <div className="video-overlay-badge" style={{ background: 'rgba(249,115,22,0.9)' }}>
                  OBJECT DETECTED: {detected.object.toUpperCase()} ({detected.confidence}%)
                </div>
                <div className="text-center text-white">
                  <div style={{ fontSize: 80, marginBottom: 16 }}>{detected.emoji}</div>
                  <p style={{ opacity: 0.8, fontSize: 14 }}>Classroom item framed and analyzed</p>
                </div>
              </div>
              <div className="p-3 d-flex justify-content-between align-items-center" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleScanObject}
                  disabled={scanning}
                  className="btn-primary-accent d-flex align-items-center gap-2"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  {scanning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Scanning Item...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Scan Next Classroom Item
                    </>
                  )}
                </button>
                <span className="text-secondary" style={{ fontSize: 12 }}>Model: YOLOv8-sign (Mocked)</span>
              </div>
            </div>
          </div>

          {/* Object Details */}
          <div className="col-lg-5">
            <div className="sb-card mb-3">
              <span className="text-secondary mb-2 d-block" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                Identified Object
              </span>
              <h4 className="fw-bold" style={{ color: 'var(--sidebar-bg)' }}>{detected.object}</h4>
              <p className="text-secondary" style={{ fontSize: 14 }}>{detected.description}</p>
            </div>

            <div className="sb-card mb-3">
              <div className="sb-card-title">🤟 How to Sign This Object</div>
              <div className="d-flex gap-3 mb-3">
                <div
                  className="text-center"
                  style={{
                    width: 70,
                    height: 70,
                    background: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                  }}
                >
                  ✋
                </div>
                <div
                  className="text-center"
                  style={{
                    width: 70,
                    height: 70,
                    background: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                  }}
                >
                  {detected.emoji}
                </div>
              </div>
              <p className="text-secondary" style={{ fontSize: 13 }}>
                {detected.signInstructions}
              </p>
            </div>

            <div className="sb-card">
              <div className="sb-card-title">🔍 Recently Identified Objects</div>
              <div className="d-flex flex-wrap gap-2">
                {recentObjects.map((obj, i) => (
                  <span key={i} className="action-chip">{obj}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
