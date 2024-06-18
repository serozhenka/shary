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
}

// export class Peer {
//   id: string;
//   pc: RTCPeerConnection;
//   ws: WebSocket;
//   remoteStream: MediaStream;
//   isPolite: boolean;
//   makingOffer: boolean;
//   videoRef: MutableRefObject<HTMLVideoElement | null>;

//   constructor({ id, rtcConfig, ws, isPolite, makingOffer }: PeerProps) {
//     this.id = id;
//     this.ws = ws;
//     this.remoteStream = new MediaStream();
//     this.isPolite = isPolite;
//     this.makingOffer = makingOffer || false;
//     this.pc = this.setupPeerConnection(rtcConfig);
//     this.videoRef = useRef(null);
//   }

//   setupPeerConnection(config: RTCConfiguration): RTCPeerConnection {
//     const pc = new RTCPeerConnection(config);
//     pc.onnegotiationneeded = getOnNegotiationHandler(this);
//     pc.oniceconnectionstatechange = getOnIceConnectionStateChangeHandler(this);
//     pc.onicecandidate = getOnIceCandidateHandler(this);
//     pc.ontrack = getOnTrackHandler(this);
//     return pc;
//   }
// }

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
