import { useEffect, useRef } from "react";

interface VideoProps {
  stream: MediaStream;
  mirrored?: boolean;
  muted?: boolean;
}

const Video = ({ stream, mirrored, muted }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      playsInline={true}
      autoPlay
      muted={muted}
      className={`${mirrored ? "self-video" : ""} 
        rounded-3
        object-fit-cover
        h-100
        w-100`}
      ref={videoRef}
    ></video>
  );
};

export default Video;
