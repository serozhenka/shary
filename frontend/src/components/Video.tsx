import { useEffect, useRef } from "react";

interface VideoProps {
  stream: MediaStream;
  mirrored?: boolean;
  muted?: boolean;
  username?: string;
  showPlaceholder?: boolean;
}

const Video = ({
  stream,
  mirrored,
  muted,
  username,
  showPlaceholder,
}: VideoProps) => {
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

  // Generate user initials
  const getUserInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Generate a consistent color based on username
  const getUserColor = (name?: string) => {
    if (!name) return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

    const colors = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="position-relative w-100 h-100 rounded-3 overflow-hidden bg-dark">
      {/* Video element */}
      <video
        playsInline={true}
        autoPlay
        muted={muted}
        className={`${mirrored ? "self-video" : ""} 
          object-fit-cover
          h-100
          w-100
          ${showPlaceholder ? "d-none" : "d-block"}`}
        ref={videoRef}
      />

      {/* Beautiful placeholder */}
      {showPlaceholder && (
        <div
          className="d-flex align-items-center justify-content-center h-100 w-100 position-absolute top-0 start-0"
          style={{
            background: getUserColor(username),
            color: "white",
          }}
        >
          <div className="text-center">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-2"
              style={{
                width: "min(80px, 20vw)",
                height: "min(80px, 20vw)",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                fontSize: "min(2rem, 5vw)",
                fontWeight: "600",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              {getUserInitials(username)}
            </div>
            <div
              className="fw-medium"
              style={{
                fontSize: "min(0.9rem, 3vw)",
                opacity: 0.9,
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              {username || "Користувач"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Video;
