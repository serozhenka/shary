import { getOnIceCandidateHandler } from "./messages/handlers/onicecandidate";
import { getOnIceConnectionStateChangeHandler } from "./messages/handlers/oniceconnectionstatechange";
import { getOnNegotiationHandler } from "./messages/handlers/onnegotiationneeded";
import { getOnTrackHandler } from "./messages/handlers/ontrack";

export interface Peer {
  id: string;
  pc: RTCPeerConnection;
  ws: WebSocket;
  remoteStream: MediaStream;
  isPolite: boolean;
  makingOffer: boolean;
  audioMuted: boolean;
}

export const bootstrapPeerConnection = (
  peer: Peer,
  handlePeersChange: (func: (peers: Peer[]) => Peer[]) => void
): void => {
  const pc = peer.pc;
  pc.onnegotiationneeded = getOnNegotiationHandler(peer);
  pc.oniceconnectionstatechange = getOnIceConnectionStateChangeHandler(peer);
  pc.onicecandidate = getOnIceCandidateHandler(peer);
  pc.ontrack = getOnTrackHandler(peer, handlePeersChange);
  peer.pc = pc;
};
