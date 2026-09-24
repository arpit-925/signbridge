import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, AlertCircle, RefreshCw, CheckCheck } from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import { notificationApi } from '../../services/notificationApi';

export default function MessagesNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifs, msgs] = await Promise.all([
        studentApi.getNotifications(),
        studentApi.getMessages(),
      ]);
      setNotifications(notifs || []);
      setMessages(msgs || []);
      if (notifs && notifs.length > 0) {
        setSelectedId(notifs[0]._id || notifs[0].id);
      }
    } catch (err) {
      setError(err.message || 'Unable to load notifications and messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectNotification = async (item) => {
    const id = item._id || item.id;
    setSelectedId(id);
    if (item.unread) {
      try {
        await notificationApi.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => ((n._id || n.id) === id ? { ...n, unread: false } : n))
        );
      } catch {
        // silent error for read marking
      }
    }
  };

  const selectedItem =
    notifications.find((n) => (n._id || n.id) === selectedId) ||
    notifications[0] ||
    null;

  const activeMessage = messages[0] || {
    from: 'Teacher Sarah Jenkins',
    to: 'Leo Chen (Class 6B)',
    date: 'Today, 08:30 AM',
    subject: 'New Assignment: Unit 4 Social Civic Signs',
    body: `Hi Leo,\n\nExcellent work on completing your Unit 3 ASL greetings practice last week! You showed remarkable consistency.\n\nFor this week, I've assigned Unit 4: Social Science and Civic Signs. Please practice these three signs with your camera converter:\n\n1. "COMMUNITY"\n2. "LEADER"\n3. "POLICE"\n\nYour video submission is due Friday. Good luck!`,
    dueDate: 'Friday, Jan 30 at 3:00 PM',
  };

  return (
    <>
      <div className="page-header">
        <h1>Messages & Notifications</h1>
        <p>Receive class assignments, grading feedback, and automated platform alerts.</p>
      </div>

      <div className="page-body">
        {loading && (
          <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
            <Loader2 size={32} className="animate-spin text-primary mb-2" />
            <span className="text-secondary" style={{ fontSize: 14 }}>Loading your communication feed...</span>
          </div>
        )}

        {error && !loading && (
          <div className="alert-card alert-pink d-flex align-items-center justify-content-between p-3 my-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
            <button onClick={fetchData} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="row g-4">
            {/* Notification List */}
            <div className="col-lg-5">
              <div className="sb-card" style={{ padding: 0 }}>
                <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span className="fw-bold" style={{ fontSize: 14 }}>Notifications ({notifications.length})</span>
                  <button
                    onClick={async () => {
                      await notificationApi.markAllAsRead();
                      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                    }}
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    style={{ fontSize: 12, color: 'var(--primary)' }}
                  >
                    <CheckCheck size={14} className="me-1" /> Mark all read
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-secondary mb-0">No notifications received yet.</p>
                ) : (
                  notifications.map((n) => {
                    const id = n._id || n.id;
                    const isSelected = selectedId === id;
                    return (
                      <div
                        key={id}
                        onClick={() => handleSelectNotification(n)}
                        className="d-flex gap-3 p-3"
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--background)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                      >
                        {n.unread ? (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'var(--accent)',
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                        ) : (
                          <span style={{ width: 8, height: 8, flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--primary)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {n.type || 'ALERT'}
                            </span>
                            <span className="text-secondary" style={{ fontSize: 11 }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                            </span>
                          </div>
                          <h6 className="fw-semibold mb-1" style={{ fontSize: 13 }}>{n.title}</h6>
                          <p className="text-secondary mb-0" style={{ fontSize: 12 }}>{n.desc || n.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Message Detail */}
            <div className="col-lg-7">
              <div className="sb-card">
                <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h5 className="fw-bold mb-0" style={{ fontSize: 16 }}>{activeMessage.from}</h5>
                    <span className="text-secondary" style={{ fontSize: 12 }}>{activeMessage.date || 'Today'}</span>
                  </div>
                  <span className="text-secondary" style={{ fontSize: 12 }}>To: {activeMessage.to}</span>
                </div>

                <h6 className="fw-bold mb-3" style={{ fontSize: 15 }}>{activeMessage.subject}</h6>
                <div className="text-secondary" style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {activeMessage.body}
                </div>

                <div
                  className="d-flex flex-wrap justify-content-between align-items-center mt-4 pt-3"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <span className="fw-bold" style={{ fontSize: 13, color: 'var(--danger)' }}>
                    Due {activeMessage.dueDate}
                  </span>
                  <div className="d-flex gap-2 mt-2 mt-sm-0">
                    <Link to="/student/lessons/4" className="btn-primary-teal text-decoration-none">
                      Start Lesson Assignment <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
