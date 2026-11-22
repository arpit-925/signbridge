import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Clock,
  Loader2,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { aiApi } from '../../services/aiApi';
import { conversionApi } from '../../services/conversionApi';

const modes = ['Sign-to-Text', 'Text-to-Sign', 'Sign-to-Voice', 'Voice-to-Sign'];

// ISL alphabet A-Z (letters the model recognizes)
const ISL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ─── Shared: Text-to-Sign Token Display ─────────────────────────────────────

function TokenDisplay({ tokens, loading }) {
  const [playIndex, setPlayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentLetterIdx, setCurrentLetterIdx] = useState(0);
  const playTimerRef = useRef(null);

  const flatFrames = useCallback(() => {
    if (!tokens || tokens.length === 0) return [];
    const frames = [];
    tokens.forEach((tok) => {
      if (tok.fallbackLevel === 1 && tok.animationUrl) {
        frames.push({ type: 'word', token: tok, label: tok.displayWord || tok.word });
      } else if (tok.fallbackLevel === 2 && tok.spellingLetters) {
        tok.spellingLetters.forEach((lt) => {
          if (lt.available) {
            frames.push({ type: 'letter', letter: lt.char, animationUrl: lt.animationUrl, token: tok });
          }
        });
      }
      // Level 3: no visual frame, shown inline
    });
    return frames;
  }, [tokens]);

  const frames = flatFrames();

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    if (frames.length === 0) return;
    setPlaying(true);
    setPlayIndex(0);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    let idx = 0;
    playTimerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= frames.length) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
        setPlaying(false);
        setPlayIndex(frames.length - 1);
      } else {
        setPlayIndex(idx);
      }
    }, Math.round(1800 / playbackSpeed));
  }, [frames, playbackSpeed]);

  const togglePlayback = () => {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const replay = () => {
    stopPlayback();
    setTimeout(startPlayback, 50);
  };

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  // Reset when tokens change
  useEffect(() => {
    stopPlayback();
    setPlayIndex(0);
  }, [tokens, stopPlayback]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5">
        <Loader2 size={32} className="animate-spin mb-3" style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Translating text to ISL signs…</span>
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <p className="text-secondary p-4 text-center mb-0" style={{ fontSize: 14 }}>
        Enter text above and click <strong>Convert to ISL Signs</strong>.
      </p>
    );
  }

  const currentFrame = frames[playIndex] || null;

  return (
    <div>
      {/* Playback viewer */}
      {frames.length > 0 && (
        <div
          className="rounded-3 mb-3"
          style={{
            background: '#0d0d1a',
            minHeight: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: 16,
          }}
        >
          {/* Current frame display */}
          <div style={{ textAlign: 'center', color: '#fff', marginBottom: 12 }}>
            {currentFrame ? (
              currentFrame.type === 'word' ? (
                <>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🤟</div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
                    {currentFrame.label?.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      background: 'rgba(16,185,129,0.2)',
                      color: '#6ee7b7',
                      borderRadius: 4,
                      padding: '2px 8px',
                      display: 'inline-block',
                    }}
                  >
                    ISL Dictionary Sign
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 72,
                      fontWeight: 900,
                      lineHeight: 1,
                      color: 'var(--primary-light)',
                    }}
                  >
                    {currentFrame.letter}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    Fingerspelling · {currentFrame.token?.displayWord?.toUpperCase()}
                  </div>
                </>
              )
            ) : (
              <div style={{ opacity: 0.5, fontSize: 14 }}>Press Play to start</div>
            )}
          </div>

          {/* Frame progress */}
          {frames.length > 1 && (
            <div style={{ width: '100%', maxWidth: 300 }}>
              <div
                style={{
                  height: 3,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((playIndex + 1) / frames.length) * 100}%`,
                    background: 'var(--primary)',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                <span>{playIndex + 1}</span>
                <span>{frames.length}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Playback controls */}
      {frames.length > 0 && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <button
            onClick={() => setPlayIndex(Math.max(0, playIndex - 1))}
            disabled={playIndex === 0 || playing}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: 13 }}
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={togglePlayback}
            className={playing ? 'btn-secondary' : 'btn-primary-teal'}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            {playing ? (
              <>
                <Pause size={14} /> Pause
              </>
            ) : (
              <>
                <Play size={14} /> Play
              </>
            )}
          </button>
          <button
            onClick={() => setPlayIndex(Math.min(frames.length - 1, playIndex + 1))}
            disabled={playIndex >= frames.length - 1 || playing}
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: 13 }}
            title="Next"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={replay}
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: 13 }}
            title="Replay from start"
          >
            <RotateCcw size={14} />
          </button>
          <div className="d-flex align-items-center gap-1 ms-auto">
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Speed</span>
            {[0.5, 1.0, 1.5].map((sp) => (
              <button
                key={sp}
                onClick={() => setPlaybackSpeed(sp)}
                className={playbackSpeed === sp ? 'btn-primary-teal' : 'btn-secondary'}
                style={{ padding: '4px 8px', fontSize: 11, minWidth: 36 }}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Token pills */}
      <div className="d-flex flex-wrap gap-2">
        {tokens.map((tok, i) => {
          const isActive =
            frames.length > 0 &&
            currentFrame &&
            ((currentFrame.type === 'word' && currentFrame.token === tok) ||
              (currentFrame.type === 'letter' && currentFrame.token === tok));

          let bgColor, borderColor, badgeLabel, badgeColor;
          if (tok.fallbackLevel === 1) {
            bgColor = isActive ? 'var(--success-light)' : 'var(--background)';
            borderColor = isActive ? 'var(--success)' : 'var(--border-color)';
            badgeLabel = 'ISL Dict';
            badgeColor = 'var(--success)';
          } else if (tok.fallbackLevel === 2) {
            bgColor = isActive ? '#ede9fe' : 'var(--background)';
            borderColor = isActive ? '#7c3aed' : 'var(--border-color)';
            badgeLabel = tok.unavailableLetters?.length > 0 ? '⚠ Partial Spell' : 'Fingerspell';
            badgeColor = tok.unavailableLetters?.length > 0 ? '#d97706' : '#7c3aed';
          } else {
            bgColor = '#fff5f5';
            borderColor = '#fc8181';
            badgeLabel = 'Unavailable';
            badgeColor = '#e53e3e';
          }

          return (
            <div
              key={i}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                padding: '8px 12px',
                minWidth: 80,
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 2 }}>
                {tok.fallbackLevel === 1 ? '👋' : tok.fallbackLevel === 2 ? '🔤' : '❌'}
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'block',
                  textTransform: 'uppercase',
                }}
              >
                {tok.displayWord || tok.word}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: badgeColor,
                  fontWeight: 600,
                  display: 'block',
                  marginTop: 2,
                }}
              >
                {badgeLabel}
              </span>
              {tok.message && (
                <div
                  style={{
                    fontSize: 10,
                    color: '#d97706',
                    marginTop: 3,
                    maxWidth: 120,
                  }}
                >
                  {tok.message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fallback legend */}
      <div
        className="d-flex flex-wrap gap-3 mt-3"
        style={{ fontSize: 11, color: 'var(--text-secondary)' }}
      >
        <span>
          <span style={{ color: 'var(--success)', fontWeight: 700 }}>●</span> ISL Dictionary sign
        </span>
        <span>
          <span style={{ color: '#7c3aed', fontWeight: 700 }}>●</span> Fingerspelling (alphabet)
        </span>
        <span>
          <span style={{ color: '#e53e3e', fontWeight: 700 }}>●</span> Sign unavailable
        </span>
      </div>
    </div>
  );
}

// ─── Sign-to-Voice Mode ──────────────────────────────────────────────────────

function SignToVoicePanel({ aiHealth }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [prediction, setPrediction] = useState({
    label: null,
    confidence: 0,
    accepted: false,
    success: false,
    message: 'Start camera to begin sign recognition',
  });

  // Accumulated recognized text buffer
  const [recognizedText, setRecognizedText] = useState('');
  const [speechStatus, setSpeechStatus] = useState('idle'); // idle | speaking | paused
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(0.9);
  const [sessionLog, setSessionLog] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isPredictingRef = useRef(false);
  const intervalIdRef = useRef(null);
  const lastLoggedRef = useRef(null);
  const utteranceRef = useRef(null);

  // Load available TTS voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        // Prefer English voice
        const enVoice = v.find((vv) => vv.lang.startsWith('en'));
        if (enVoice) setSelectedVoice(enVoice.name);
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const captureAndPredictFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isPredictingRef.current) return;
    const video = videoRef.current;
    if (video.readyState !== 4 || video.videoWidth === 0) return;

    isPredictingRef.current = true;
    setIsProcessingFrame(true);

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          isPredictingRef.current = false;
          setIsProcessingFrame(false);
          return;
        }
        try {
          const res = await aiApi.predictSign({ file: blob });
          const result = {
            label: res?.label || (res?.text !== 'UNKNOWN' ? res?.text : null),
            confidence: res?.confidence || 0,
            accepted: !!res?.accepted,
            success: !!res?.success,
            message: res?.message || (res?.success ? 'Sign recognized' : 'No hand detected'),
          };
          setPrediction(result);

          // Buffer stable accepted predictions (deduplicate within 3s)
          if (result.success && result.accepted && result.label) {
            const now = Date.now();
            const last = lastLoggedRef.current;
            if (!last || last.label !== result.label || now - last.time >= 3000) {
              lastLoggedRef.current = { label: result.label, time: now };
              setRecognizedText((prev) => {
                const trimmed = prev.trim();
                return trimmed ? trimmed + ' ' + result.label : result.label;
              });
              setSessionLog((prev) => [
                { label: result.label, confidence: result.confidence, time: new Date() },
                ...prev.slice(0, 9),
              ]);
            }
          }
        } catch {
          // silent
        } finally {
          isPredictingRef.current = false;
          setIsProcessingFrame(false);
        }
      },
      'image/jpeg',
      0.82
    );
  }, []);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(captureAndPredictFrame, 750);
    } catch (err) {
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access in browser settings.';
      else if (err.name === 'NotFoundError') msg = 'No camera found. Please connect a webcam.';
      else if (err.name === 'NotReadableError') msg = 'Camera is in use by another application.';
      else if (err.message) msg = err.message;
      setCameraError(msg);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setIsProcessingFrame(false);
    isPredictingRef.current = false;
    setPrediction((p) => ({ ...p, label: null, confidence: 0, accepted: false, success: false, message: 'Camera stopped' }));
  }, []);

  useEffect(() => () => { stopCamera(); window.speechSynthesis.cancel(); }, [stopCamera]);

  const speakText = (text) => {
    if (!text?.trim()) return;
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = speechRate;
    if (selectedVoice) {
      const voice = voices.find((v) => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    }
    utterance.onstart = () => { setIsSpeaking(true); setSpeechStatus('speaking'); };
    utterance.onend = () => { setIsSpeaking(false); setSpeechStatus('idle'); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeechStatus('idle'); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setSpeechStatus('paused');
    }
  };

  const handleResume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeechStatus('speaking');
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeechStatus('idle');
  };

  const handleReplay = () => {
    speakText(recognizedText);
  };

  const handleClearText = () => {
    window.speechSynthesis.cancel();
    setRecognizedText('');
    setIsSpeaking(false);
    setSpeechStatus('idle');
  };

  const ttsSupported = 'speechSynthesis' in window;

  return (
    <div className="row g-4">
      {/* Left: Camera Feed */}
      <div className="col-lg-7">
        <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              minHeight: 360,
              position: 'relative',
              background: '#0d0d1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: cameraActive ? 'block' : 'none',
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Status badge */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: cameraActive
                  ? isProcessingFrame ? 'rgba(59,130,246,0.9)' : 'rgba(34,197,94,0.9)'
                  : 'rgba(239,68,68,0.85)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              {cameraActive ? (isProcessingFrame ? 'ANALYZING…' : 'SIGN TRACKING ACTIVE') : 'CAMERA OFF'}
            </div>

            {/* HUD overlay */}
            {cameraActive && prediction.accepted && prediction.label && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  background: 'rgba(15,23,42,0.85)',
                  border: '1px solid rgba(34,197,94,0.5)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 16px',
                  borderRadius: 8,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>{prediction.label}</div>
                <div style={{ fontSize: 12 }}>
                  <div className="fw-bold">Sign Detected</div>
                  <div style={{ opacity: 0.8 }}>{(prediction.confidence * 100).toFixed(1)}% confidence</div>
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="text-center text-white p-4" style={{ zIndex: 1 }}>
                {cameraLoading ? (
                  <>
                    <Loader2 size={44} className="animate-spin mb-3" style={{ margin: '0 auto', color: '#60a5fa' }} />
                    <p className="fw-semibold mb-1">Requesting camera access…</p>
                  </>
                ) : cameraError ? (
                  <>
                    <AlertTriangle size={44} className="mb-3" style={{ margin: '0 auto', color: '#fbbf24' }} />
                    <p className="text-danger fw-semibold mb-2" style={{ fontSize: 14 }}>{cameraError}</p>
                    <button onClick={startCamera} className="btn-primary-accent" style={{ fontSize: 13 }}>
                      Retry Camera
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 56, marginBottom: 10 }}>📷</div>
                    <p className="fw-semibold mb-1">Sign-to-Voice Recognition</p>
                    <p style={{ opacity: 0.7, fontSize: 13, maxWidth: 320, margin: '0 auto 14px' }}>
                      Show ISL hand signs to the camera. Recognized signs are converted to spoken audio.
                    </p>
                    <button onClick={startCamera} className="btn-primary-accent d-inline-flex align-items-center gap-2">
                      <Camera size={16} /> Start Camera
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Camera controls bar */}
          <div
            className="d-flex flex-wrap align-items-center justify-content-between p-3 gap-2"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div className="d-flex gap-2 flex-wrap">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="btn-secondary d-flex align-items-center gap-2 text-danger"
                  style={{ fontSize: 13 }}
                >
                  <CameraOff size={15} /> Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="btn-primary-accent d-flex align-items-center gap-2"
                  style={{ fontSize: 13 }}
                >
                  {cameraLoading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
                  {cameraLoading ? 'Starting…' : 'Start Camera'}
                </button>
              )}
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right' }}
              className="d-flex align-items-center gap-1"
            >
              {aiHealth.status === 'connected' ? (
                <><CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> AI Connected</>
              ) : (
                <><XCircle size={12} style={{ color: 'var(--danger)' }} /> AI Offline</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: TTS panel */}
      <div className="col-lg-5">
        {!ttsSupported && (
          <div
            className="sb-card mb-3"
            style={{ background: '#fff5f5', border: '1px solid #fc8181' }}
          >
            <div className="d-flex gap-2 align-items-center">
              <AlertTriangle size={18} style={{ color: '#e53e3e', flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>
                Text-to-speech is not supported in this browser. Try Chrome or Edge.
              </span>
            </div>
          </div>
        )}

        {/* Recognized text display */}
        <div className="sb-card mb-3">
          <div className="sb-card-title">🎤 Recognized Sign Text</div>
          <textarea
            value={recognizedText}
            onChange={(e) => setRecognizedText(e.target.value)}
            rows={4}
            placeholder="Recognized signs will appear here as you sign to the camera…"
            style={{
              width: '100%',
              resize: 'vertical',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: recognizedText ? 'var(--surface)' : 'var(--background)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {recognizedText && (
            <button
              onClick={handleClearText}
              style={{
                marginTop: 8,
                background: 'none',
                border: 'none',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              × Clear text
            </button>
          )}
        </div>

        {/* Audio controls */}
        <div className="sb-card mb-3">
          <div className="sb-card-title">🔊 Speech Controls</div>

          <div className="d-flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => speakText(recognizedText)}
              disabled={!recognizedText.trim() || speechStatus === 'speaking' || !ttsSupported}
              className="btn-primary-accent d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <Volume2 size={15} /> Speak
            </button>
            <button
              onClick={handlePause}
              disabled={speechStatus !== 'speaking' || !ttsSupported}
              className="btn-secondary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <Pause size={15} /> Pause
            </button>
            <button
              onClick={handleResume}
              disabled={speechStatus !== 'paused' || !ttsSupported}
              className="btn-secondary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <Play size={15} /> Resume
            </button>
            <button
              onClick={handleStop}
              disabled={speechStatus === 'idle' || !ttsSupported}
              className="btn-secondary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <Square size={15} /> Stop
            </button>
            <button
              onClick={handleReplay}
              disabled={!recognizedText.trim() || speechStatus === 'speaking' || !ttsSupported}
              className="btn-secondary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <RotateCcw size={15} /> Replay
            </button>
          </div>

          {/* Speech status */}
          {speechStatus !== 'idle' && (
            <div
              className="d-flex align-items-center gap-2 mb-3"
              style={{
                fontSize: 13,
                color: speechStatus === 'speaking' ? 'var(--success)' : '#d97706',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: speechStatus === 'speaking' ? 'var(--success)' : '#d97706',
                  display: 'inline-block',
                  animation: speechStatus === 'speaking' ? 'pulse 1s infinite' : 'none',
                }}
              />
              {speechStatus === 'speaking' ? 'Speaking…' : 'Paused'}
            </div>
          )}

          {/* Voice & Rate settings */}
          <div className="d-flex flex-column gap-2">
            {voices.length > 0 && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    fontSize: 13,
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Speech Rate: {speechRate}×
              </label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Session log */}
        {sessionLog.length > 0 && (
          <div className="sb-card">
            <div className="sb-card-title">🕐 Recent Signs</div>
            {sessionLog.map((entry, i) => (
              <div
                key={i}
                className="d-flex justify-content-between align-items-center py-2"
                style={{
                  borderBottom: i < sessionLog.length - 1 ? '1px solid var(--border-color)' : 'none',
                  fontSize: 13,
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge"
                    style={{ background: 'var(--primary-light)', color: '#fff', fontWeight: 700, padding: '3px 8px' }}
                  >
                    {entry.label}
                  </span>
                  <span>{(entry.confidence * 100).toFixed(0)}% confidence</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  <Clock size={11} style={{ marginRight: 3 }} />
                  {entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Voice-to-Sign Mode ──────────────────────────────────────────────────────

function VoiceToSignPanel() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttError, setSttError] = useState(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [tokens, setTokens] = useState([]);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    setSttError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t + ' ';
        } else {
          interimText += t;
        }
      }
      if (finalText) {
        setTranscript((prev) => (prev + ' ' + finalText).trim());
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setSttError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'no-speech') {
        // non-fatal, keep listening
      } else if (event.error === 'network') {
        setSttError('Network error during speech recognition. Check your internet connection.');
      } else {
        setSttError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      setInterimTranscript('');
      if (isListeningRef.current) {
        // Auto-restart if we're supposed to still be listening
        try { recognition.start(); } catch { /* ignore */ }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setSttError('Could not start speech recognition: ' + err.message);
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  };

  const handleConvertToSign = async () => {
    const text = transcript.trim();
    if (!text) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await aiApi.textToSign({ text });
      setTokens(res?.tokens || []);
    } catch (err) {
      setTranslateError(err.message || 'Failed to convert speech to ISL signs.');
      setTokens([]);
    } finally {
      setTranslating(false);
    }
  };

  const handleClear = () => {
    stopListening();
    setTranscript('');
    setInterimTranscript('');
    setTokens([]);
    setTranslateError(null);
    setSttError(null);
  };

  const handleReplaySign = () => {
    if (transcript.trim()) {
      handleConvertToSign();
    }
  };

  return (
    <div className="row g-4">
      {/* Left: Mic + text input */}
      <div className="col-lg-5">
        <div className="sb-card">
          <div className="sb-card-title">🎙️ Speech Input</div>

          {!sttSupported && (
            <div
              className="mb-3"
              style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}
            >
              <AlertTriangle size={16} style={{ color: '#e53e3e', marginRight: 6 }} />
              Speech recognition is not supported in this browser. Try Chrome or Edge.
            </div>
          )}

          {sttError && (
            <div
              className="mb-3"
              style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}
            >
              <AlertTriangle size={16} style={{ color: '#e53e3e', marginRight: 6 }} />
              {sttError}
            </div>
          )}

          {/* Mic controls */}
          <div className="d-flex gap-2 flex-wrap mb-3">
            {!isListening ? (
              <button
                onClick={startListening}
                disabled={!sttSupported}
                className="btn-primary-accent d-flex align-items-center gap-2"
                style={{ fontSize: 13 }}
              >
                <Mic size={15} /> Start Listening
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="btn-secondary d-flex align-items-center gap-2 text-danger"
                style={{ fontSize: 13 }}
              >
                <MicOff size={15} /> Stop Listening
              </button>
            )}
            <button
              onClick={handleClear}
              className="btn-secondary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <XCircle size={15} /> Clear
            </button>
          </div>

          {/* Listening indicator */}
          {isListening && (
            <div
              className="d-flex align-items-center gap-2 mb-3"
              style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--danger)',
                  display: 'inline-block',
                  animation: 'pulse 1s infinite',
                }}
              />
              Listening… speak now
            </div>
          )}

          {/* Transcript */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Recognized Speech (editable)
            </label>
            <textarea
              rows={5}
              value={transcript + (interimTranscript ? ' ' + interimTranscript : '')}
              onChange={(e) => {
                setTranscript(e.target.value);
                setInterimTranscript('');
              }}
              placeholder="Your speech will appear here… You can also type or edit text directly."
              style={{
                width: '100%',
                resize: 'vertical',
                border: `1px solid ${isListening ? 'var(--danger)' : 'var(--border-color)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: 'var(--text-primary)',
                background: 'var(--surface)',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />
            {interimTranscript && (
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                (interim: {interimTranscript})
              </span>
            )}
          </div>

          <div className="d-flex gap-2 mt-3">
            <button
              onClick={handleConvertToSign}
              disabled={!transcript.trim() || translating}
              className="btn-primary-accent d-flex align-items-center gap-2 flex-grow-1 justify-content-center"
              style={{ fontSize: 13 }}
            >
              {translating ? (
                <><Loader2 size={15} className="animate-spin" /> Converting…</>
              ) : (
                <><Sparkles size={15} /> Convert to ISL Signs</>
              )}
            </button>
            {tokens.length > 0 && (
              <button
                onClick={handleReplaySign}
                disabled={translating}
                className="btn-secondary d-flex align-items-center gap-2"
                style={{ fontSize: 13 }}
                title="Re-translate"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {translateError && (
            <div
              className="mt-3"
              style={{ background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}
            >
              <AlertTriangle size={15} style={{ color: '#e53e3e', marginRight: 6 }} />
              {translateError}
            </div>
          )}

          <div
            className="mt-3 p-3 rounded-2 d-flex gap-2"
            style={{ background: 'var(--info-light)', fontSize: 12, color: 'var(--info)' }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Voice → Speech-to-Text → Editable Text → ISL Signs. The same three-level fallback applies:
              Dictionary sign → Fingerspelling → Unavailable message.
            </span>
          </div>
        </div>
      </div>

      {/* Right: ISL sign output */}
      <div className="col-lg-7">
        <div className="sb-card">
          <div className="sb-card-title">🤟 ISL Sign Output</div>
          <TokenDisplay tokens={tokens} loading={translating} />
          {!translating && tokens.length === 0 && !transcript && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--text-secondary)',
                fontSize: 14,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
              <p className="mb-0">
                Click <strong>Start Listening</strong>, speak naturally, then click{' '}
                <strong>Convert to ISL Signs</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sign-to-Text Mode (original camera mode) ────────────────────────────────

function SignToTextPanel({ aiHealth }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [prediction, setPrediction] = useState({
    label: null,
    confidence: 0,
    accepted: false,
    success: false,
    message: 'Start camera to begin sign recognition',
  });
  const [sessionLog, setSessionLog] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isPredictingRef = useRef(false);
  const intervalIdRef = useRef(null);
  const lastLoggedRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const history = await conversionApi.getHistory();
      if (history?.length > 0) setSessionLog(history);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const captureAndPredictFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isPredictingRef.current) return;
    const video = videoRef.current;
    if (video.readyState !== 4 || video.videoWidth === 0) return;

    isPredictingRef.current = true;
    setIsProcessingFrame(true);

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) { isPredictingRef.current = false; setIsProcessingFrame(false); return; }
        try {
          const res = await aiApi.predictSign({ file: blob });
          const result = {
            label: res?.label || (res?.text !== 'UNKNOWN' ? res?.text : null),
            confidence: res?.confidence || 0,
            accepted: !!res?.accepted,
            success: !!res?.success,
            message: res?.message || (res?.success ? 'Sign recognized' : 'No hand detected'),
            provider: res?.provider || 'FastAPI + MediaPipe + TensorFlow',
          };
          setPrediction(result);

          if (result.success && result.accepted && result.label) {
            const now = Date.now();
            const last = lastLoggedRef.current;
            if (!last || last.label !== result.label || now - last.time >= 3000) {
              lastLoggedRef.current = { label: result.label, time: now };
              setSessionLog((prev) => [
                { predictedText: result.label, confidence: result.confidence, createdAt: new Date().toISOString() },
                ...prev.slice(0, 19),
              ]);
            }
          }
        } catch (err) {
          setPrediction((prev) => ({
            ...prev,
            success: false,
            accepted: false,
            message: err.message?.includes('unavailable') ? 'AI service unavailable' : (err.message || 'Prediction failed'),
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

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Webcam not supported on this browser.');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraActive(true);
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = setInterval(captureAndPredictFrame, 750);
    } catch (err) {
      let msg = 'Could not access camera.';
      if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access.';
      else if (err.name === 'NotFoundError') msg = 'No camera found. Please connect a webcam.';
      else if (err.name === 'NotReadableError') msg = 'Camera is in use by another application.';
      else if (err.message) msg = err.message;
      setCameraError(msg);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (intervalIdRef.current) { clearInterval(intervalIdRef.current); intervalIdRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setIsProcessingFrame(false);
    isPredictingRef.current = false;
    setPrediction((p) => ({ ...p, label: null, confidence: 0, accepted: false, success: false, message: 'Camera stopped' }));
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <div className="sb-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{ minHeight: 380, position: 'relative', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: cameraActive ? 'block' : 'none',
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: cameraActive
                  ? isProcessingFrame ? 'rgba(59,130,246,0.9)' : 'rgba(34,197,94,0.9)'
                  : 'rgba(239,68,68,0.85)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              {cameraActive ? (isProcessingFrame ? 'ANALYZING FRAME…' : 'HAND TRACKING ACTIVE') : 'CAMERA OFFLINE'}
            </div>

            {cameraActive && prediction.accepted && prediction.label && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  background: 'rgba(15,23,42,0.85)',
                  border: '1px solid rgba(34,197,94,0.5)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 16px',
                  borderRadius: 8,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>{prediction.label}</div>
                <div style={{ fontSize: 12 }}>
                  <div className="fw-bold">Sign Detected</div>
                  <div style={{ opacity: 0.8 }}>{(prediction.confidence * 100).toFixed(1)}% confidence</div>
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="text-center text-white p-4" style={{ zIndex: 1 }}>
                {cameraLoading ? (
                  <>
                    <Loader2 size={48} className="animate-spin mb-3" style={{ margin: '0 auto', color: '#60a5fa' }} />
                    <p className="fw-semibold mb-1">Requesting camera access…</p>
                    <p style={{ opacity: 0.7, fontSize: 13 }}>Please allow camera permission.</p>
                  </>
                ) : cameraError ? (
                  <>
                    <AlertTriangle size={48} className="mb-3" style={{ margin: '0 auto', color: '#fbbf24' }} />
                    <p className="text-danger fw-semibold mb-2" style={{ fontSize: 15 }}>{cameraError}</p>
                    <button onClick={startCamera} className="btn-primary-accent" style={{ margin: '0 auto', fontSize: 13 }}>
                      Retry Camera Access
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 64, marginBottom: 12 }}>📷</div>
                    <p className="fw-semibold mb-1" style={{ fontSize: 16 }}>Live Visual Sign Recognition</p>
                    <p style={{ opacity: 0.7, fontSize: 13, maxWidth: 360, margin: '0 auto 16px' }}>
                      Turn on your webcam to recognize Indian Sign Language (ISL) alphabet gestures in real-time.
                    </p>
                    <button onClick={startCamera} className="btn-primary-accent d-inline-flex align-items-center gap-2" style={{ fontSize: 14 }}>
                      <Camera size={18} /> Start Webcam
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div
            className="d-flex flex-wrap align-items-center justify-content-between p-3 gap-3"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div>
              {cameraActive ? (
                <button onClick={stopCamera} className="btn-secondary d-flex align-items-center gap-2 text-danger" style={{ fontSize: 13 }}>
                  <CameraOff size={16} /> Stop Camera
                </button>
              ) : (
                <button onClick={startCamera} disabled={cameraLoading} className="btn-primary-accent d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                  {cameraLoading ? <><Loader2 size={16} className="animate-spin" /> Starting…</> : <><Camera size={16} /> Start Camera</>}
                </button>
              )}
            </div>
            <div className="d-flex align-items-center gap-1" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {aiHealth.status === 'connected' ? (
                <><CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> AI Connected ({aiHealth.classes_count} classes)</>
              ) : (
                <><XCircle size={12} style={{ color: 'var(--danger)' }} /> AI offline</>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        {/* Detection card */}
        <div className="sb-card mb-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span style={{ fontSize: 12, fontWeight: 700, color: prediction.accepted ? 'var(--success)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
              DETECTED SIGN
            </span>
            {cameraActive && (
              <span
                className="badge"
                style={{
                  fontSize: 11,
                  background: prediction.accepted ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                  color: prediction.accepted ? 'var(--success)' : 'var(--text-secondary)',
                }}
              >
                {prediction.accepted ? 'Verified Sign' : prediction.message}
              </span>
            )}
          </div>

          <div
            className="d-flex align-items-center gap-3 p-3 my-2 rounded-3"
            style={{
              background: prediction.accepted ? 'rgba(34,197,94,0.08)' : 'var(--background)',
              border: `1px solid ${prediction.accepted ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}`,
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
                boxShadow: prediction.accepted ? '0 4px 12px rgba(34,197,94,0.35)' : 'none',
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
                  ? 'Hand posture matched with high confidence'
                  : cameraActive
                  ? 'Position hand in front of camera'
                  : 'Start camera to see live classification'}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="fw-semibold" style={{ fontSize: 13 }}>AI Model Confidence</span>
              <span className="fw-bold" style={{ fontSize: 13, color: prediction.accepted ? 'var(--success)' : 'var(--text-secondary)' }}>
                {(prediction.confidence * 100).toFixed(1)}% Match
              </span>
            </div>
            <div className="progress-bar-wrapper">
              <div className={`progress-bar-fill ${prediction.accepted ? 'green' : 'orange'}`} style={{ width: `${Math.round(prediction.confidence * 100)}%` }} />
            </div>
            {prediction.confidence > 0 && !prediction.accepted && (
              <span style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, display: 'block' }}>
                Confidence below acceptance threshold (50%)
              </span>
            )}
          </div>
        </div>

        {/* Session log */}
        <div className="sb-card">
          <div className="sb-card-title d-flex justify-content-between align-items-center">
            <span>🕐 Session Log</span>
            <button onClick={loadHistory} className="btn btn-sm btn-link p-0 text-decoration-none" title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
          {sessionLog.length === 0 ? (
            <p className="text-secondary p-3 text-center mb-0" style={{ fontSize: 13 }}>
              No sign gestures recorded. Start camera to begin.
            </p>
          ) : (
            sessionLog.slice(0, 6).map((entry, i) => (
              <div
                key={i}
                className="d-flex justify-content-between align-items-center py-2"
                style={{ borderBottom: i < Math.min(sessionLog.length, 6) - 1 ? '1px solid var(--border-color)' : 'none', fontSize: 13 }}
              >
                <div className="d-flex align-items-center gap-2">
                  <span className="badge" style={{ background: 'var(--primary-light)', color: '#fff', fontWeight: 700, padding: '3px 8px' }}>
                    {entry.predictedText || entry.phrase || '?'}
                  </span>
                  <span className="fw-medium">
                    {entry.confidence ? `${(entry.confidence * 100).toFixed(0)}% confidence` : 'Detected sign'}
                  </span>
                </div>
                <span className="text-secondary d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                  <Clock size={11} />
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Text-to-Sign Mode ───────────────────────────────────────────────────────

function TextToSignPanel() {
  const [textInput, setTextInput] = useState('Hello thank you good morning');
  const [tokens, setTokens] = useState([]);
  const [translating, setTranslating] = useState(false);

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    setTranslating(true);
    try {
      const res = await aiApi.textToSign({ text: textInput.trim() });
      setTokens(res?.tokens || []);
    } catch (err) {
      alert(err.message || 'Text-to-sign translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <div className="sb-card">
          <div className="sb-card-title">✍️ Enter Text to Sign</div>
          <form onSubmit={handleConvert}>
            <div className="sb-form-group">
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Sentence or Phrase
              </label>
              <textarea
                rows={5}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type text to convert to ISL sign sequence…"
                style={{
                  width: '100%',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={translating || !textInput.trim()}
              className="btn-primary-accent w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {translating ? (
                <><Loader2 size={16} className="animate-spin" /> Translating…</>
              ) : (
                <><Sparkles size={16} /> Convert to ISL Signs</>
              )}
            </button>
          </form>

          <div
            className="mt-3 p-3 rounded-2"
            style={{ background: 'var(--info-light)', fontSize: 12, color: 'var(--info)' }}
          >
            <div className="fw-semibold mb-1">Three-Level Fallback</div>
            <div>1. <strong>ISL Dictionary</strong> — verified word sign</div>
            <div>2. <strong>Fingerspelling</strong> — alphabet signs for each letter</div>
            <div>3. <strong>Unavailable</strong> — clear message if sign cannot be shown</div>
          </div>
        </div>
      </div>
      <div className="col-lg-7">
        <div className="sb-card">
          <div className="sb-card-title">🤟 ISL Sign Sequence</div>
          <TokenDisplay tokens={tokens} loading={translating} />
        </div>
      </div>
    </div>
  );
}

// ─── Main SignConverter Component ────────────────────────────────────────────

export default function SignConverter() {
  const [activeMode, setActiveMode] = useState('Sign-to-Text');
  const [aiHealth, setAiHealth] = useState({
    status: 'checking',
    model_loaded: false,
    provider: 'FastAPI + MediaPipe + TensorFlow',
    model: 'SignBridge Vision Core',
    classes_count: 26,
  });

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
      setAiHealth((prev) => ({ ...prev, status: 'offline', model_loaded: false }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 15000);
    return () => clearInterval(id);
  }, [checkHealth]);

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
              onClick={() => setActiveMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>

        {activeMode === 'Sign-to-Text' && <SignToTextPanel aiHealth={aiHealth} />}
        {activeMode === 'Text-to-Sign' && <TextToSignPanel />}
        {activeMode === 'Sign-to-Voice' && <SignToVoicePanel aiHealth={aiHealth} />}
        {activeMode === 'Voice-to-Sign' && <VoiceToSignPanel />}
      </div>
    </>
  );
}
