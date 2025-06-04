import { useEffect, useRef } from "react";

interface ScreenShareProps {
  stream: MediaStream;
  username?: string;
  isLocal?: boolean;
}

const ScreenShare = ({
  stream,
  username,
  isLocal = false,
}: ScreenShareProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <div className="screen-share-container position-relative w-100 h-100 rounded-3 overflow-hidden bg-dark">
      {/* Screen share indicator */}
      <div className="position-absolute top-0 start-0 p-3 z-1">
        <div className="bg-primary bg-opacity-75 text-white px-3 py-1 rounded-pill d-flex align-items-center">
          <i className="bi bi-display me-2"></i>
          <span className="fw-medium">
            {isLocal ? "Ви ділитесь екраном" : `${username} ділиться екраном`}
          </span>
        </div>
      </div>

      <video
        playsInline
        autoPlay
        muted={isLocal}
        ref={videoRef}
        className="w-100 h-100 object-fit-contain bg-black"
        onError={(e) => {
          console.error("ScreenShare video error:", e);
        }}
      />
    </div>
  );
};

export default ScreenShare;
