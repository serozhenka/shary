import { Link } from "react-router-dom";
import "../styles/Landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="hero-section">
        <div className="container">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-6">
              <h1 className="hero-title">Shary</h1>
              <p className="hero-tagline">
                Instant group video chat—no installs, no logins, just share and
                talk.
              </p>
              <p className="hero-description">
                Shary is a lightweight, browser-powered WebRTC tool built for
                students and teams. Spin up HD group calls in seconds—just
                create a room, share the link, and you're live. No downloads, no
                friction: seamless video, crystal-clear audio, and end-to-end
                encryption keep your conversations private and distraction-free.
              </p>
              <div className="cta-buttons">
                <Link to="/rooms" className="btn btn-primary btn-lg">
                  Start a Call
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image-container">
                <div className="hero-image">
                  <div className="video-grid-preview">
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
                        alt="Alex"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Alex</div>
                    </div>
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop"
                        alt="Taylor"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Taylor</div>
                    </div>
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop"
                        alt="Jamie"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Jamie</div>
                    </div>
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop"
                        alt="Sam"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Sam</div>
                    </div>
                  </div>
                  <div className="call-controls-preview">
                    <div className="control-preview">
                      <i className="bi bi-mic-fill"></i>
                    </div>
                    <div className="control-preview">
                      <i className="bi bi-camera-video-fill"></i>
                    </div>
                    <div className="control-preview red">
                      <i className="bi bi-telephone-x-fill"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
