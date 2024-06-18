import { Peer } from "../../peer";
import { InboundTrackMutedMessage } from "../inbound";

interface TrackMutedProps {
  peers: Peer[];
  message: InboundTrackMutedMessage;
  handlePeersChange: (func: (peers: Peer[]) => Peer[]) => void;
}

export const trackMutedHandler = ({
  peers,
  message,
  handlePeersChange,
}: TrackMutedProps): void => {
  const mutedPeer = peers.find((p) => p.id === message.payload.clientId);
  if (!mutedPeer) return;

  const tracks = mutedPeer.remoteStream
    .getTracks()
    .filter((track) => track.kind == message.payload.trackKind);

  tracks.forEach((track) => {
    track.stop();
    mutedPeer.remoteStream.removeTrack(track);
  });

  handlePeersChange((peers) => {
    return peers.map((peer) => {
      if (peer.id !== mutedPeer.id) return peer;

      return {
        ...peer,
        remoteStream: new MediaStream(peer.remoteStream.getTracks()),
      };
    });
  });
};
