import { Link } from 'react-router-dom';
import { Hand, Play, Check, ArrowRight, BookOpen, Languages, BarChart3, GraduationCap, Users } from 'lucide-react';
import { landingFeatures, pricingPlans } from '../../data/mockData';

const featureIcons = [BookOpen, Languages, BarChart3, GraduationCap, Users];
const featureColors = ['#D1FAE5', '#DBEAFE', '#FEF3C7', '#FCE7F3', '#EDE9FE'];
const featureIconColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <div className="sidebar-logo-icon" style={{ width: 36, height: 36 }}>
                <Hand size={18} color="#fff" />
              </div>
              <span className="fw-bold fs-5" style={{ letterSpacing: 1 }}>SIGN BRIDGE</span>
            </div>
            <div className="d-none d-md-flex align-items-center gap-4">
              <a href="#features" className="text-secondary fw-medium" style={{ fontSize: 14 }}>Features</a>
              <a href="#pricing" className="text-secondary fw-medium" style={{ fontSize: 14 }}>Pricing</a>
              <Link to="/login" className="fw-medium" style={{ fontSize: 14, color: 'var(--text-primary)' }}>Sign In</Link>
              <Link to="/signup" className="btn-primary-accent">Get Started</Link>
            </div>
            <Link to="/signup" className="btn-primary-accent d-md-none" style={{ padding: '8px 16px', fontSize: 13 }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <span className="hero-tag">Deaf & Hard-of-Hearing Education Platform</span>
              <h1 className="display-5 fw-bold mb-3" style={{ lineHeight: 1.2 }}>
                Bridging Communication<br />Through Learning
              </h1>
              <p className="text-secondary mb-4" style={{ fontSize: 16, maxWidth: 500 }}>
                An inclusive K-12 learning space combining interactive visual lessons, real-time sign language conversion, and AI-powered classroom tools for deaf and hard-of-hearing students.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/signup" className="btn-primary-accent" style={{ padding: '14px 28px', fontSize: 16 }}>
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <button className="btn-secondary" style={{ padding: '14px 28px', fontSize: 16 }}>
                  <Play size={18} /> Watch Demo
                </button>
              </div>
            </div>
            <div className="col-lg-6">
              <div style={{
                background: 'linear-gradient(135deg, #A7F3D0 0%, #93C5FD 50%, #FDE68A 100%)',
                borderRadius: 'var(--radius-xl)',
                padding: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 360,
              }}>
                <div className="text-center">
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🤟</div>
                  <div className="bg-white rounded-3 p-3 d-inline-block shadow-sm">
                    <span className="fw-bold" style={{ color: 'var(--primary)', fontSize: 14 }}>ASL ANIMATIONS!</span>
                  </div>
                  <div className="mt-3 d-flex gap-2 justify-content-center">
                    <span style={{ fontSize: 40 }}>👧🏽</span>
                    <span style={{ fontSize: 40 }}>👦🏻</span>
                    <span style={{ fontSize: 40 }}>👩🏿</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-6 fw-bold">Everything You Need</h2>
            <p className="text-secondary" style={{ maxWidth: 500, margin: '0 auto' }}>
              A complete platform for inclusive education with tools for students, teachers, and parents.
            </p>
          </div>
          <div className="row g-4">
            {landingFeatures.map((feature, i) => (
              <div key={i} className="col-lg col-md-4 col-sm-6">
                <div className="feature-card">
                  <div className="feature-icon" style={{ background: featureColors[i] }}>
                    {featureIcons[i] && (() => { const Icon = featureIcons[i]; return <Icon size={24} color={featureIconColors[i]} />; })()}
                  </div>
                  <h5 className="fw-semibold mb-2" style={{ fontSize: 15 }}>{feature.title}</h5>
                  <p className="text-secondary mb-0" style={{ fontSize: 13 }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 0', background: 'var(--background)' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-6 fw-bold">Flexible Plans for Everyone</h2>
            <p className="text-secondary">Choose the plan that works best for your school or individual needs.</p>
          </div>
          <div className="row g-4 justify-content-center">
            {pricingPlans.map((plan, i) => (
              <div key={i} className="col-lg-4 col-md-6">
                <div className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                  <h3 className="fw-semibold" style={{ fontSize: 18 }}>{plan.name}</h3>
                  <div className="price">
                    {plan.price}<small style={{ fontSize: 14, fontWeight: 400 }}>{plan.period}</small>
                  </div>
                  <ul className="pricing-features">
                    {plan.features.map((f, j) => (
                      <li key={j}>
                        <Check size={16} color={plan.featured ? '#10B981' : 'var(--primary)'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.featured ? (
                    <button className="btn-primary-accent w-100" style={{ padding: '14px' }}>{plan.btn}</button>
                  ) : (
                    <button className="btn-secondary w-100" style={{ padding: '14px' }}>{plan.btn}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-4 mb-3">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Hand size={20} color="var(--accent)" />
                <span className="fw-bold fs-5">SIGN BRIDGE</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, maxWidth: 280 }}>
                Bridging communication divides through inclusive education technology for deaf and hard-of-hearing communities.
              </p>
            </div>
            <div className="col-lg-4 col-md-6">
              <h6 className="fw-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>Products</h6>
              <ul className="list-unstyled" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <li className="mb-2">Platform</li>
                <li className="mb-2">Converter App</li>
                <li className="mb-2">Teacher Tools</li>
                <li className="mb-2">Parent Portal</li>
              </ul>
            </div>
            <div className="col-lg-4 col-md-6">
              <h6 className="fw-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>Resources</h6>
              <ul className="list-unstyled" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <li className="mb-2">Documentation</li>
                <li className="mb-2">K-12 Standards</li>
                <li className="mb-2">API Reference</li>
                <li className="mb-2">Support Center</li>
              </ul>
            </div>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '32px 0 16px' }} />
          <p className="text-center mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            © 2025 Sign Bridge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
