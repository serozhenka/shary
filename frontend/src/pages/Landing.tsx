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
                Миттєвий груповий відеочат — без встановлень, без реєстрації,
                просто поділіться та спілкуйтеся.
              </p>
              <p className="hero-description">
                Shary — це легкий браузерний вебзастосунок створений для малих
                команд. Запускайте HD групові дзвінки за лічені секунди — просто
                створіть кімнату, поділіться посиланням, і ви в ефірі. Без
                завантажень, без перешкод: бездоганне відео, чистий звук та
                наскрізне шифрування роблять ваші розмови приватними та
                комфортними.
              </p>
              <div className="cta-buttons">
                <Link to="/rooms" className="btn btn-primary btn-lg">
                  Почати дзвінок
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image-container">
                <div className="hero-image">
                  <div className="video-grid-preview">
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces"
                        alt="Олексій"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Олексій</div>
                    </div>
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face"
                        alt="Марія"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Марія</div>
                    </div>
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face"
                        alt="Андрій"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Андрій</div>
                    </div>
                    <div className="video-preview-item">
                      <img
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face"
                        alt="Софія"
                        className="video-preview-avatar"
                      />
                      <div className="video-preview-label">Софія</div>
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
