import { Peer } from "../../peer";

export const getOnTrackHandler = (
  peer: Peer,
  handlePeersChange: (func: (peers: Peer[]) => Peer[]) => void
) => {
  return async ({ track }: RTCTrackEvent) => {
    handlePeersChange((peers) => {
      return peers.map((p) => {
        if (p.id !== peer.id) return p;
        return {
          ...p,
          remoteStream: new MediaStream([...p.remoteStream.getTracks(), track]),
        };
      });
    });
  };
};
