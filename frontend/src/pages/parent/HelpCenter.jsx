import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { helpCategories } from '../../data/mockData';

export default function HelpCenter() {
  const [faqOpen, setFaqOpen] = useState(true);

  return (
    <>
      <div className="page-header">
        <h1>Help & Resources Support</h1>
        <p>Access FAQ guides, video tutorials, and guidelines on K-12 deaf educational standards.</p>
      </div>

      <div className="page-body">
        {/* Help Banner */}
        <div className="sb-card mb-4 text-center text-white" style={{ background: 'var(--sidebar-bg)', padding: '40px 20px' }}>
          <h3 className="fw-bold mb-3" style={{ color: '#fff' }}>How can we support you today?</h3>
          <div className="search-bar mb-0 mx-auto" style={{ maxWidth: 600 }}>
            <Search size={18} />
            <input type="text" placeholder="Search for visual guides, K-12 deaf educational standards, or teacher dashboards..." />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="row g-3 mb-4">
          {helpCategories.map((cat, i) => (
            <div key={i} className="col-md-3">
              <div className="sb-card text-center h-100 mb-0" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{cat.icon}</div>
                <h6 className="fw-bold mb-2" style={{ fontSize: 14 }}>{cat.title}</h6>
                <p className="text-secondary mb-0" style={{ fontSize: 12 }}>{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* FAQ Pane */}
          <div className="col-lg-7">
            <div className="sb-card">
              <div className="sb-card-title">Popular FAQ Questions</div>
              <div className="border rounded-2 p-3">
                <div
                  className="d-flex justify-content-between align-items-center cursor-pointer"
                  onClick={() => setFaqOpen(!faqOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="fw-semibold" style={{ fontSize: 14 }}>How does real-time ASL-to-text conversion work?</span>
                  {faqOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {faqOpen && (
                  <p className="text-secondary mt-3 mb-0" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Our platform processes your classroom webcam stream locally, converting hand gestures to text or speech in real-time without sending private data to server nodes.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Guided Video Tutorials */}
          <div className="col-lg-5">
            <div className="sb-card">
              <div className="sb-card-title">Guided Video Tutorials</div>
              <div className="video-container mb-3" style={{ minHeight: 180 }}>
                <div className="text-center text-white">
                  <Play size={36} color="var(--accent)" />
                  <p className="mb-0 mt-2" style={{ fontSize: 12, opacity: 0.8 }}>Setting up your parent visual dashboard</p>
                </div>
              </div>
              <span className="fw-semibold" style={{ fontSize: 13 }}>Setting up your parent visual dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
