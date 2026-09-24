import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const steps = ['Welcome', 'Role', 'Profile', 'Accessibility Preferences', 'Get Started'];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(3);
  const [captions, setCaptions] = useState(true);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* Stepper */}
        <div className="stepper">
          {steps.map((step, i) => (
            <div key={i} className="d-flex align-items-center">
              <div className="stepper-step">
                <div className={`stepper-dot ${i < currentStep ? 'completed' : i === currentStep ? 'active' : ''}`} />
                <span className={`stepper-label ${i === currentStep ? 'active' : ''}`}>{step}</span>
              </div>
              {i < steps.length - 1 && <div className={`stepper-line ${i < currentStep ? 'completed' : ''}`} />}
            </div>
          ))}
        </div>

        <div className="row align-items-center">
          <div className="col-md-4 text-center mb-4 mb-md-0">
            <div style={{ width: 160, height: 160, margin: '0 auto', background: 'linear-gradient(135deg, #FDE68A, #FDBA74)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              🤟
            </div>
          </div>
          <div className="col-md-8">
            <h3 className="fw-bold mb-2" style={{ fontSize: 22 }}>Accessibility Preferences</h3>
            <p className="text-secondary mb-4" style={{ fontSize: 14 }}>
              Customize your sign interpretation and visual environment before getting started with Sign Bridge portals.
            </p>

            <div className="sb-form-group">
              <label>Preferred Sign Language Standard</label>
              <select defaultValue="asl">
                <option value="asl">American Sign Language (ASL)</option>
                <option value="bsl">British Sign Language (BSL)</option>
              </select>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3 py-2">
              <div>
                <span className="fw-semibold" style={{ fontSize: 13 }}>Video Captions Preference</span>
                <p className="mb-0 text-secondary" style={{ fontSize: 12 }}>Always display text subtitles alongside ASL visual coaching</p>
              </div>
              <div className={`toggle-switch ${captions ? 'on' : ''}`} onClick={() => setCaptions(!captions)} />
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ fontSize: 13 }}>Classroom Interface Text Size</span>
                <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Large (120% magnification)</span>
              </div>
              <div className="progress-bar-wrapper" style={{ height: 6 }}>
                <div className="progress-bar-fill teal" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button className="btn-secondary" onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}>Back</button>
          <button className="btn-primary-accent" onClick={() => navigate(isAuthenticated && user ? `/${user.role.toLowerCase()}` : '/signup')}>
            Save & Continue <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
