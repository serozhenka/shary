import { Peer } from "../peer";
import Video from "./Video";

export interface PeerComponentProps {
  peer: Peer;
  isVideoEnabled: boolean;
}

const PeerComponent = ({ peer }: PeerComponentProps) => {
  return (
    <div id={peer.id} className="position-relative d-block">
      <div className="position-absolute z-1 bottom-0 start-0 p-2 text-white bg-dark bg-opacity-50 rounded-bottom-3 ps-3 pe-3">
        {peer.username || `User ${peer.id.slice(0, 4)}`}
        <i
          className={`ms-2 bi ${
            peer.audioMuted ? "bi-mic-mute-fill text-danger" : ""
          }`}
        ></i>
      </div>
      <Video stream={peer.remoteStream} mirrored={false} muted={false}></Video>
    </div>
  );
};

export default PeerComponent;
