import { Peer } from "../../peer";

const peerStreamTypes = new Map<string, Map<string, "media" | "screen">>();

export const registerStreamType = (
  peerId: string,
  streamId: string,
  streamType: "media" | "screen"
) => {
  if (!peerStreamTypes.has(peerId)) {
    peerStreamTypes.set(peerId, new Map());
  }
  peerStreamTypes.get(peerId)!.set(streamId, streamType);
};

export const getOnTrackHandler = (
  peer: Peer,
  handlePeersChange: (func: (peers: Peer[]) => Peer[]) => void
) => {
  return async ({ track, streams }: RTCTrackEvent) => {
    handlePeersChange((peers) => {
      return peers.map((p) => {
        if (p.id !== peer.id) return p;

        const incomingStream = streams[0];
        if (!incomingStream) {
          console.warn("No stream found for incoming track");
          return p;
        }

        const peerStreams = peerStreamTypes.get(peer.id);
        const streamType = peerStreams?.get(incomingStream.id);

        if (!streamType) {
          console.warn(
            `No stream type registered for stream ${incomingStream.id}, peer ${peer.id}. Skipping track until metadata arrives.`
          );
          return p;
        }

        const updatedPeer = { ...p };

        if (streamType === "screen") {
          if (track.kind === "video") {
            const screenVideoTracks =
              updatedPeer.remoteScreenStream.getVideoTracks();
            screenVideoTracks.forEach((existingTrack) => {
              existingTrack.stop();
              updatedPeer.remoteScreenStream.removeTrack(existingTrack);
            });
          } else if (track.kind === "audio") {
            const screenAudioTracks =
              updatedPeer.remoteScreenStream.getAudioTracks();
            screenAudioTracks.forEach((existingTrack) => {
              existingTrack.stop();
              updatedPeer.remoteScreenStream.removeTrack(existingTrack);
            });
          }

          updatedPeer.remoteScreenStream.addTrack(track);
          updatedPeer.isScreenSharing = true;
        } else {
          if (track.kind === "video") {
            const cameraVideoTracks = updatedPeer.remoteStream.getVideoTracks();
            cameraVideoTracks.forEach((existingTrack) => {
              existingTrack.stop();
              updatedPeer.remoteStream.removeTrack(existingTrack);
            });
            updatedPeer.videoMuted = false;
          } else if (track.kind === "audio") {
            const existingAudioTracks =
              updatedPeer.remoteStream.getAudioTracks();
            existingAudioTracks.forEach((existingTrack) => {
              existingTrack.stop();
              updatedPeer.remoteStream.removeTrack(existingTrack);
            });
            updatedPeer.audioMuted = false;
          }

          updatedPeer.remoteStream.addTrack(track);
        }

        return updatedPeer;
      });
    });
  };
};
