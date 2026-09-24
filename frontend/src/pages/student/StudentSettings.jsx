import { useState, useEffect } from 'react';
import { User, Accessibility, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';

const settingsTabs = [
  { label: 'Accessibility Options', icon: Accessibility },
  { label: 'Account Profile', icon: User },
  { label: 'Security & Password', icon: Shield },
];

export default function StudentSettings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Accessibility Options');

  // Form states
  const [captionSize, setCaptionSize] = useState(user?.accessibilityPreferences?.captionSize || '24px');
  const [playbackSpeed, setPlaybackSpeed] = useState(user?.accessibilityPreferences?.playbackSpeed || 0.75);
  const [highContrast, setHighContrast] = useState(user?.accessibilityPreferences?.highContrast ?? true);
  const [autoplay, setAutoplay] = useState(user?.accessibilityPreferences?.autoplay ?? false);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [school, setSchool] = useState(user?.school || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setSchool(user.school || '');
      if (user.accessibilityPreferences) {
        setCaptionSize(user.accessibilityPreferences.captionSize || '24px');
        setPlaybackSpeed(user.accessibilityPreferences.playbackSpeed || 0.75);
        setHighContrast(user.accessibilityPreferences.highContrast ?? true);
        setAutoplay(user.accessibilityPreferences.autoplay ?? false);
      }
    }
  }, [user]);

  const handleSaveAccessibility = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await authApi.updateProfile({
        accessibilityPreferences: {
          captionSize,
          playbackSpeed: parseFloat(playbackSpeed),
          highContrast,
          autoplay,
        },
      });
      if (updateUser) updateUser(updated);
      setFeedback({ type: 'success', text: 'Accessibility preferences updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update preferences.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await authApi.updateProfile({
        name,
        phone,
        school,
      });
      if (updateUser) updateUser(updated);
      setFeedback({ type: 'success', text: 'Profile information updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setFeedback({ type: 'error', text: 'Please fill both current and new password.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setFeedback({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Student Profile & Settings</h1>
        <p>Configure learning triggers, visual adjustments, and personal accessibility preferences.</p>
      </div>

      <div className="page-body">
        {feedback && (
          <div className={`alert-card ${feedback.type === 'success' ? 'alert-green' : 'alert-pink'} mb-4 d-flex align-items-center gap-2`}>
            {feedback.type === 'success' ? (
              <CheckCircle size={18} color="var(--success)" />
            ) : (
              <AlertCircle size={18} color="var(--danger)" />
            )}
            <span style={{ fontSize: 14 }}>{feedback.text}</span>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="sb-card mb-4">
          <div className="d-flex align-items-center gap-4">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {user?.avatar || 'LC'}
            </div>
            <div className="flex-grow-1">
              <h5 className="fw-bold mb-1" style={{ fontSize: 16 }}>{user?.name || 'Leo Chen'}</h5>
              <p className="text-secondary mb-0" style={{ fontSize: 13 }}>
                Role: {user?.role?.toUpperCase()} | {user?.email} • {user?.school || 'Metro Public School'}
              </p>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Settings Nav */}
          <div className="col-md-4 col-lg-3">
            <div className="sb-card" style={{ padding: 8 }}>
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    onClick={() => {
                      setActiveTab(tab.label);
                      setFeedback(null);
                    }}
                    className="d-flex align-items-center gap-3 w-100 text-start p-3 rounded-2 mb-1"
                    style={{
                      border: 'none',
                      background: activeTab === tab.label ? 'var(--success-light)' : 'transparent',
                      color: activeTab === tab.label ? 'var(--success)' : 'var(--text-secondary)',
                      fontWeight: activeTab === tab.label ? 600 : 400,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content */}
          <div className="col-md-8 col-lg-9">
            <div className="sb-card">
              {activeTab === 'Accessibility Options' && (
                <form onSubmit={handleSaveAccessibility}>
                  <h5 className="fw-bold mb-4" style={{ fontSize: 17 }}>Accessibility Options</h5>

                  <div className="sb-form-group">
                    <label>Caption Display Size</label>
                    <select value={captionSize} onChange={(e) => setCaptionSize(e.target.value)}>
                      <option value="24px">24px — Large Contrast AAA</option>
                      <option value="16px">16px — Standard Medium</option>
                      <option value="32px">32px — Extra Large Focus</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="fw-semibold d-block mb-2" style={{ fontSize: 13 }}>
                      Sign Playback Speed: {playbackSpeed}x
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-secondary" style={{ fontSize: 12 }}>0.5x</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(e.target.value)}
                        style={{ flex: 1, accentColor: 'var(--primary)' }}
                      />
                      <span className="text-secondary" style={{ fontSize: 12 }}>2.0x</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <span className="fw-semibold d-block" style={{ fontSize: 14 }}>High Contrast Palette</span>
                      <span className="text-secondary" style={{ fontSize: 12 }}>Forces system text to render in high-contrast styling against light background.</span>
                    </div>
                    <div className={`toggle-switch ${highContrast ? 'on' : ''}`} onClick={() => setHighContrast(!highContrast)} />
                  </div>

                  <div className="d-flex align-items-center justify-content-between py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <span className="fw-semibold d-block" style={{ fontSize: 14 }}>Video Autoplay Loop</span>
                      <span className="text-secondary" style={{ fontSize: 12 }}>Continually loop teacher visual sign demonstration.</span>
                    </div>
                    <div className={`toggle-switch ${autoplay ? 'on' : ''}`} onClick={() => setAutoplay(!autoplay)} />
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <button type="submit" disabled={saving} className="btn-primary-teal d-flex align-items-center gap-2">
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      Save Preferences
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'Account Profile' && (
                <form onSubmit={handleSaveProfile}>
                  <h5 className="fw-bold mb-4" style={{ fontSize: 17 }}>Account Profile</h5>

                  <div className="sb-form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>

                  <div className="sb-form-group">
                    <label>Contact Phone</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>

                  <div className="sb-form-group">
                    <label>School / Campus</label>
                    <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} />
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <button type="submit" disabled={saving} className="btn-primary-teal d-flex align-items-center gap-2">
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      Save Profile
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'Security & Password' && (
                <form onSubmit={handleChangePassword}>
                  <h5 className="fw-bold mb-4" style={{ fontSize: 17 }}>Change Password</h5>

                  <div className="sb-form-group">
                    <label>Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                  </div>

                  <div className="sb-form-group">
                    <label>New Password (min 6 chars)</label>
                    <input type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New secure password" />
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <button type="submit" disabled={saving} className="btn-primary-accent d-flex align-items-center gap-2">
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
