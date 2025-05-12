import { Peer } from "../../peer";

export const getOnTrackHandler = (
  peer: Peer,
  handlePeersChange: (func: (peers: Peer[]) => Peer[]) => void
) => {
  return async ({ track }: RTCTrackEvent) => {
    handlePeersChange((peers) => {
      console.log("peer", peer);
      console.log("PEERS", peers);
      console.log("track", track);

      return peers.map((p) => {
        if (p.id !== peer.id) return p;

        // Add track to existing stream instead of creating new one
        p.remoteStream.addTrack(track);

        console.log(
          "Updated remote stream tracks:",
          p.remoteStream.getTracks()
        );

        return p;
      });
    });
  };
};
