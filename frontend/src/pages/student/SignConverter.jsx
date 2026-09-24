import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Clock,
  Loader2,
  Sparkles,
  RefreshCw,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { aiApi } from '../../services/aiApi';
import { conversionApi } from '../../services/conversionApi';

const modes = ['Sign-to-Text', 'Text-to-Sign', 'Sign-to-Voice', 'Voice-to-Sign'];

export default function SignConverter() {
  const [activeMode, setActiveMode] = useState('Sign-to-Text');

  // Camera & Video Streaming States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Live Real Prediction State (No fake hardcoded sentences!)
  const [prediction, setPrediction] = useState({
    label: null,
    confidence: 0,
    accepted: false,
    success: false,
    message: 'Start camera to begin sign recognition',
  });
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);

  // AI Service Provider Health State
  const [aiHealth, setAiHealth] = useState({
    status: 'checking',
    model_loaded: false,
    provider: 'FastAPI + MediaPipe + TensorFlow',
    model: 'SignBridge Vision Core',
  });

  // Session History Log
  const [sessionLog, setSessionLog] = useState([]);

  // Text-to-Sign Mode States
  const [textInput, setTextInput] = useState('Hello thank you good morning');
  const [translatedTokens, setTranslatedTokens] = useState([]);
  const [translatingText, setTranslatingText] = useState(false);

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isPredictingRef = useRef(false);
  const intervalIdRef = useRef(null);
  const lastLoggedPredictionRef = useRef(null);

  // Check backend & FastAPI health status
  const checkHealth = useCallback(async () => {
    try {
      const health = await aiApi.healthCheck();
      setAiHealth({
        status: health?.status === 'healthy' ? 'connected' : 'offline',
        model_loaded: !!health?.model_loaded,
        provider: health?.provider || 'FastAPI + MediaPipe + TensorFlow',
        model: health?.model || 'SignBridge Vision Core',
        classes_count: health?.classes_count || 26,
      });
    } catch {
      setAiHealth({
        status: 'offline',
        model_loaded: false,
        provider: 'FastAPI (Service Unavailable)',
        model: 'SignBridge Vision Core',
      });
    }
  }, []);

  // Fetch real conversion history from DB on mount
  const loadHistory = useCallback(async () => {
    try {
      const history = await conversionApi.getHistory();
      if (history && history.length > 0) {
        setSessionLog(history);
      }
    } catch {
      // Keep local state if database fetch is empty
    }
  }, []);

  useEffect(() => {
    checkHealth();
    loadHistory();

    const healthInterval = setInterval(checkHealth, 15000);
    return () => clearInterval(healthInterval);
  }, [checkHealth, loadHistory]);

  // Frame capture and prediction pipeline
  const captureAndPredictFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isPredictingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    isPredictingRef.current = true;
    setIsProcessingFrame(true);

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          isPredictingRef.current = false;
          setIsProcessingFrame(false);
          return;
        }

        try {
          const res = await aiApi.predictSign({ file: blob });
          // Format: { label, text, confidence, accepted, success, message, provider }
          const result = {
            label: res?.label || (res?.text !== 'UNKNOWN' ? res?.text : null),
            confidence: res?.confidence || 0,
            accepted: !!res?.accepted,
            success: !!res?.success,
            message: res?.message || (res?.success ? 'Sign recognized' : 'No hand detected'),
            provider: res?.provider || 'FastAPI + MediaPipe + TensorFlow',
          };

          setPrediction(result);

          // Add to session log if recognized with high confidence (deduplicate within 3 seconds)
          if (result.success && result.accepted && result.label) {
            const now = Date.now();
            const last = lastLoggedPredictionRef.current;
            const isSameSignRecent = last && last.label === result.label && now - last.time < 3000;

            if (!isSameSignRecent) {
              lastLoggedPredictionRef.current = { label: result.label, time: now };
              setSessionLog((prev) => [
                {
                  predictedText: result.label,
                  confidence: result.confidence,
                  createdAt: new Date().toISOString(),
                },
                ...prev.slice(0, 19),
              ]);
            }
          }
        } catch (err) {
          setPrediction((prev) => ({
            ...prev,
            success: false,
            accepted: false,
            message: err.message?.includes('unavailable')
              ? 'AI service unavailable'
              : (err.message || 'Prediction failed'),
          }));
        } finally {
          isPredictingRef.current = false;
          setIsProcessingFrame(false);
        }
      },
      'image/jpeg',
      0.82
    );
  }, []);

  // Start Camera
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam media streaming is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraError(null);

      // Start periodic prediction cycle (approximately once every 750ms)
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(captureAndPredictFrame, 750);
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMsg = 'Could not access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please grant browser camera access to use sign recognition.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found. Please connect a webcam device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is currently in use by another application.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setCameraError(errorMsg);
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setIsProcessingFrame(false);
    isPredictingRef.current = false;
    setPrediction((prev) => ({
      ...prev,
      label: null,
      confidence: 0,
      accepted: false,
      success: false,
      message: 'Camera stopped',
    }));
  }, []);

  // Clean up media streams on unmount or tab change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Voice synthesis for Sign-to-Voice mode
  const handleSpeakAloud = () => {
    if (!prediction.label || !prediction.accepted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Letter ${prediction.label}`);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Text-to-Sign translation
  const handleTextToSign = async (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    setTranslatingText(true);
    try {
      const res = await aiApi.textToSign({ text: textInput.trim() });
      setTranslatedTokens(res?.tokens || []);
    } catch (err) {
      alert(err.message || 'Text-to-sign translation failed.');
    } finally {
      setTranslatingText(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>AI Sign Language Converter</h1>
        <p>Real-time Indian Sign Language (ISL) recognition powered by MediaPipe and TensorFlow.</p>
      </div>

      <div className="page-body">
        {/* Mode Tabs */}
        <div className="filter-tabs mb-4">
          {modes.map((mode) => (
            <button
              key={mode}
              className={`filter-tab ${activeMode === mode ? 'active' : ''}`}
              onClick={() => {
                if (activeMode !== mode && cameraActive && mode === 'Text-to-Sign') {
                  stopCamera();
                }
                setActiveMode(mode);
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {activeMode === 'Text-to-Sign' ? (
          /* Text-to-Sign Mode */
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="sb-card">
                <div className="sb-card-title">✍️ Enter English Sentence to Sign</div>
                <form onSubmit={handleTextToSign}>
                  <div className="sb-form-group">
                    <label>Classroom Sentence or Phrase</label>
                    <textarea
                      rows={4}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type text to convert to ISL sign sequence..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={translatingText}
                    className="btn-primary-accent w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    {translatingText ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Translating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Convert to ISL Signs
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="sb-card">
                <div className="sb-card-title">🤟 Generated Sign Sequence</div>
                {translatedTokens.length === 0 ? (
                  <p className="text-secondary p-4 text-center mb-0">
                    Click "Convert to ISL Signs" to see dictionary sign tokens.
                  </p>
                ) : (
                  <div className="d-flex flex-wrap gap-2 pt-2">
                    {translatedTokens.map((token, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2 text-center"
                        style={{
                          background: token.matched ? 'var(--success-light)' : 'var(--background)',
                          border: `1px solid ${token.matched ? 'var(--success)' : 'var(--border-color)'}`,
                          minWidth: 100,
                        }}
                      >
                        <div style={{ fontSize: 32, marginBottom: 4 }}>
                          {token.matched ? '👋' : '🔤'}
                        </div>
                        <span className="fw-bold d-block" style={{ fontSize: 13, textTransform: 'uppercase' }}>
                          {token.word}
                        </span>
                        <span className="text-secondary d-block" style={{ fontSize: 10 }}>
                          {token.category || (token.matched ? 'Dictionary' : 'Finger Spelled')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Sign-to-Text / Sign-to-Voice Live Webcam Modes */
          <div className="row g-4">
            {/* Live Video Camera Panel */}
            <div className="col-lg-7">
              <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  className="video-container"
                  style={{
                    minHeight: 380,
                    position: 'relative',
                    background: '#0d0d1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Real Web Camera Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)', // Mirrored for intuitive selfie gesture interaction
                      display: cameraActive ? 'block' : 'none',
                    }}
                  />

                  {/* Hidden Canvas for Frame Capture */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Status Overlay Badges */}
                  <div
                    className="video-overlay-badge"
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      background: cameraActive
                        ? isProcessingFrame
                          ? 'rgba(59, 130, 246, 0.9)'
                          : 'rgba(34, 197, 94, 0.9)'
                        : 'rgba(239, 68, 68, 0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'inline-block',
                      }}
                    />
                    {cameraActive
                      ? isProcessingFrame
                        ? 'ANALYZING FRAME...'
                        : 'HAND TRACKING ACTIVE'
                      : 'CAMERA OFFLINE'}
                  </div>

                  {/* Real-time Recognition HUD Overlay */}
                  {cameraActive && prediction.accepted && prediction.label && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 16,
                        left: 16,
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        backdropFilter: 'blur(8px)',
                        padding: '8px 16px',
                        borderRadius: 8,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 800,
                          color: 'var(--success, #22c55e)',
                          lineHeight: 1,
                        }}
                      >
                        {prediction.label}
                      </div>
                      <div style={{ fontSize: 12 }}>
                        <div className="fw-bold">Sign Detected</div>
                        <div style={{ opacity: 0.8 }}>{(prediction.confidence * 100).toFixed(1)}% confidence</div>
                      </div>
                    </div>
                  )}

                  {/* Inactive / Camera Off State */}
                  {!cameraActive && (
                    <div className="text-center text-white p-4" style={{ zIndex: 1 }}>
                      {cameraLoading ? (
                        <>
                          <Loader2 size={48} className="animate-spin mb-3 text-primary" style={{ margin: '0 auto' }} />
                          <p className="fw-semibold mb-1" style={{ fontSize: 16 }}>
                            Requesting camera access...
                          </p>
                          <p style={{ opacity: 0.7, fontSize: 13 }}>Please allow camera permission in your browser.</p>
                        </>
                      ) : cameraError ? (
                        <>
                          <AlertTriangle size={48} className="mb-3 text-warning" style={{ margin: '0 auto' }} />
                          <p className="fw-semibold text-danger mb-2" style={{ fontSize: 15 }}>
                            {cameraError}
                          </p>
                          <button
                            onClick={startCamera}
                            className="btn-primary-accent btn-sm mt-2"
                            style={{ margin: '0 auto' }}
                          >
                            Retry Camera Access
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 64, marginBottom: 12 }}>📷</div>
                          <p className="fw-semibold mb-1" style={{ fontSize: 16 }}>
                            Live Visual Sign Recognition Stream
                          </p>
                          <p style={{ opacity: 0.7, fontSize: 13, maxWidth: 360, margin: '0 auto 16px' }}>
                            Turn on your webcam to recognize Indian Sign Language (ISL) alphabet gestures in real-time.
                          </p>
                          <button
                            onClick={startCamera}
                            className="btn-primary-accent d-inline-flex align-items-center gap-2"
                            style={{ padding: '10px 22px', fontSize: 14 }}
                          >
                            <Camera size={18} /> Start Webcam
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Camera Controls & Provider Status */}
                <div
                  className="d-flex flex-wrap align-items-center justify-content-between p-3 gap-3"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <div className="d-flex align-items-center gap-2">
                    {cameraActive ? (
                      <button
                        onClick={stopCamera}
                        className="btn-secondary d-flex align-items-center gap-2 text-danger"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        <CameraOff size={16} /> Stop Camera
                      </button>
                    ) : (
                      <button
                        onClick={startCamera}
                        disabled={cameraLoading}
                        className="btn-primary-accent d-flex align-items-center gap-2"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        {cameraLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Starting...
                          </>
                        ) : (
                          <>
                            <Camera size={16} /> Start Camera
                          </>
                        )}
                      </button>
                    )}

                    {activeMode === 'Sign-to-Voice' && (
                      <button
                        onClick={handleSpeakAloud}
                        disabled={!prediction.accepted || !prediction.label}
                        className="btn-secondary d-flex align-items-center gap-2"
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        <Volume2 size={16} /> Speak Aloud
                      </button>
                    )}
                  </div>

                  <div
                    className="d-flex flex-column gap-1"
                    style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}
                  >
                    <span>
                      Model: <strong>{aiHealth.model}</strong>
                    </span>
                    <span className="d-flex align-items-center justify-content-end gap-1">
                      {aiHealth.status === 'connected' ? (
                        <>
                          <CheckCircle2 size={13} className="text-success" />
                          <span>Status: Connected ({aiHealth.classes_count} Classes)</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} className="text-danger" />
                          <span className="text-danger">Status: AI service unavailable</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Recognition Output Card */}
            <div className="col-lg-5">
              <div className="sb-card mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: prediction.accepted ? 'var(--success)' : 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}
                  >
                    DETECTED SIGN
                  </span>
                  {cameraActive && (
                    <span
                      className="badge"
                      style={{
                        fontSize: 11,
                        background: prediction.accepted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color: prediction.accepted ? 'var(--success)' : 'var(--text-secondary)',
                      }}
                    >
                      {prediction.accepted ? 'Verified Sign' : prediction.message}
                    </span>
                  )}
                </div>

                {/* Real Alphabet Display */}
                <div
                  className="d-flex align-items-center gap-3 p-3 my-2 rounded-3"
                  style={{
                    background: prediction.accepted ? 'rgba(34, 197, 94, 0.08)' : 'var(--background)',
                    border: `1px solid ${prediction.accepted ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-color)'}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 900,
                      minWidth: 64,
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: prediction.accepted ? 'var(--success)' : 'var(--border-color)',
                      color: '#fff',
                      borderRadius: 12,
                      boxShadow: prediction.accepted ? '0 4px 12px rgba(34, 197, 94, 0.35)' : 'none',
                    }}
                  >
                    {prediction.accepted && prediction.label ? prediction.label : <HelpCircle size={28} opacity={0.6} />}
                  </div>
                  <div>
                    <h3 className="mb-0 fw-bold" style={{ fontSize: 20, color: 'var(--primary-dark)' }}>
                      {prediction.accepted && prediction.label ? `Alphabet: ${prediction.label}` : prediction.message}
                    </h3>
                    <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                      {prediction.accepted
                        ? `Hand posture matched with high confidence`
                        : cameraActive
                        ? 'Position hand in front of camera'
                        : 'Start camera to see live classification'}
                    </p>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold" style={{ fontSize: 13 }}>
                      AI Model Confidence
                    </span>
                    <span
                      className="fw-bold"
                      style={{
                        fontSize: 13,
                        color: prediction.accepted ? 'var(--success)' : 'var(--text-secondary)',
                      }}
                    >
                      {(prediction.confidence * 100).toFixed(1)}% Match
                    </span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div
                      className={`progress-bar-fill ${prediction.accepted ? 'green' : 'orange'}`}
                      style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                    />
                  </div>
                  {prediction.confidence > 0 && !prediction.accepted && (
                    <span style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, display: 'block' }}>
                      Confidence below acceptance threshold (50%)
                    </span>
                  )}
                </div>
              </div>

              {/* Real Session Log History */}
              <div className="sb-card">
                <div className="sb-card-title d-flex justify-content-between align-items-center">
                  <span>🕐 Session Log History</span>
                  <button
                    onClick={loadHistory}
                    className="btn btn-sm btn-link p-0 text-decoration-none"
                    title="Refresh history"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                {sessionLog.length === 0 ? (
                  <p className="text-secondary p-3 text-center mb-0">
                    No sign gestures recorded yet. Start camera to begin.
                  </p>
                ) : (
                  sessionLog.slice(0, 6).map((entry, i) => (
                    <div
                      key={i}
                      className="d-flex justify-content-between align-items-center py-2"
                      style={{
                        borderBottom: i < Math.min(sessionLog.length, 6) - 1 ? '1px solid var(--border-color)' : 'none',
                        fontSize: 13,
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            padding: '3px 8px',
                          }}
                        >
                          {entry.predictedText || entry.phrase || 'A'}
                        </span>
                        <span className="fw-medium">
                          {entry.confidence ? `${(entry.confidence * 100).toFixed(0)}% confidence` : 'Detected sign'}
                        </span>
                      </div>
                      <span className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                        <Clock size={12} />{' '}
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
