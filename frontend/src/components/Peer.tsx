import { Peer } from "../peer";
import Video from "./Video";

export interface PeerComponentProps {
  peer: Peer;
  isVideoEnabled: boolean;
}

const PeerComponent = ({ peer }: PeerComponentProps) => {
  return (
    <div id={peer.id} className="position-relative d-block">
      <div className="position-absolute z-1 bottom-0 mb-3 ms-3 text-white">
        showing client {peer.id}
      </div>
      <Video stream={peer.remoteStream} mirrored={false} muted={false}></Video>
    </div>
  );
};

export default PeerComponent;
