interface VideoProps {
  stream: MediaStream;
  mirrored?: boolean;
  muted?: boolean;
}

const Video = ({ stream, mirrored, muted }: VideoProps) => {
  return (
    <video
      playsInline={true}
      autoPlay
      muted={muted}
      width={300}
      height={300}
      className={`${mirrored ? "self-video" : ""}\
        bg-secondary-subtle
        rounded-2
        z-0
        m-2`}
      ref={(video) => {
        if (video && stream) video.srcObject = stream;
      }}
    ></video>
  );
};

export default Video;
