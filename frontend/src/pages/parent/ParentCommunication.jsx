import { useState, useEffect } from 'react';
import { Send, Clock, Video, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { parentApi } from '../../services/parentApi';

export default function ParentCommunication() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentApi.getMessages();
      setMessages(res || []);
    } catch (err) {
      setError(err.message || 'Unable to load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      // Find teacher ID from an existing message, or use demo teacher id
      const sampleReceiverId = messages[0]?.sender?._id || messages[0]?.sender || '67bb4ff3fbbbbbbbbbbbbbbb';
      await parentApi.sendMessage(sampleReceiverId, inputText.trim(), 'Update from Parent');
      setInputText('');
      await fetchMessages();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const defaultChatMessages = [
    { sender: 'teacher', text: "Hello Mr. Chen! Leo did a fantastic job on his greetings quiz today.", time: '09:15 AM' },
    { sender: 'parent', text: "Thank you so much Mrs. Jenkins! We practiced together last night with the converter.", time: '09:45 AM', status: 'Delivered' },
    { sender: 'teacher', text: "It clearly showed! His hand positioning for 'thank you' was flawless.", time: '10:02 AM' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Messages & Communication</h1>
        <p>Direct communication workspace between parents and classroom instructors.</p>
      </div>

      <div className="page-body">
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading teacher communications...</span>
          </div>
        )}

        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchMessages} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="row g-4">
            {/* Left conversations list */}
            <div className="col-lg-4">
              <div className="sb-card" style={{ padding: 0 }}>
                <div className="p-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h6 className="fw-bold mb-0" style={{ fontSize: 15 }}>Teacher Contacts</h6>
                </div>

                <div
                  className="d-flex align-items-center gap-3 p-3"
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--background)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    SJ
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold" style={{ fontSize: 13 }}>Sarah Jenkins (Leo)</span>
                    </div>
                    <p className="text-secondary mb-0 text-truncate" style={{ fontSize: 12 }}>
                      {messages[0]?.body?.slice(0, 35) || 'Recent updates on classroom signs...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upcoming Conference Card */}
              <div className="sb-card mt-3">
                <div className="sb-card-title">📅 Upcoming Conferences</div>
                <div className="p-3 rounded-2" style={{ background: 'var(--warning-light)', borderLeft: '3px solid var(--warning)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold" style={{ fontSize: 13 }}>Sarah Jenkins • IEP Review</span>
                    <span className="badge-upcoming" style={{ fontSize: 9, padding: '2px 6px' }}>Upcoming</span>
                  </div>
                  <p className="mb-0 text-secondary" style={{ fontSize: 12 }}>Tomorrow, 10:00 AM • Sign Bridge Video Room</p>
                </div>
              </div>
            </div>

            {/* Right chat panel */}
            <div className="col-lg-8">
              <div className="sb-card d-flex flex-column" style={{ minHeight: 480 }}>
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: 15 }}>Sarah Jenkins</h6>
                    <span className="text-secondary" style={{ fontSize: 12 }}>Lead ASL Instructor • Metro Public School</span>
                  </div>
                  <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
                    <Video size={14} /> Join Video Room
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-grow-1 overflow-y-auto mb-3" style={{ minHeight: 280 }}>
                  {defaultChatMessages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.sender === 'parent' ? 'sent' : 'received'}`}>
                      <div>{m.text}</div>
                      <div className="chat-timestamp text-end">
                        {m.time} {m.status && `• ${m.status}`}
                      </div>
                    </div>
                  ))}
                  {messages.map((m, i) => (
                    <div key={i} className="chat-bubble received">
                      <div>{m.body}</div>
                      <div className="chat-timestamp text-end">
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message to Mrs. Jenkins..."
                      className="form-control"
                      style={{ borderRadius: 'var(--radius-md)', fontSize: 14 }}
                    />
                    <button
                      type="submit"
                      disabled={sending || !inputText.trim()}
                      className="btn-primary-teal d-flex align-items-center gap-1"
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
