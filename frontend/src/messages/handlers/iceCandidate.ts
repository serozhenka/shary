import { Peer } from "../../peer";
import { InboundIceCandidateMessage } from "../inbound";

interface IceCandidateHandlerProps {
  message: InboundIceCandidateMessage;
  peers: Peer[];
}

export const iceCandidateHandler = async ({
  message,
  peers,
}: IceCandidateHandlerProps) => {
  console.log("Received ice candidate message", message.payload);

  const peer = peers.find((p) => p.id == message.payload.clientId);
  if (!peer) {
    console.log(`No peers matches given ID: ${message.payload.clientId}`);
    return;
  }

  const offerCollision =
    peer.makingOffer || peer.pc.signalingState !== "stable";
  const ignoreOffer = !peer.isPolite && offerCollision;

  try {
    await peer.pc.addIceCandidate(message.payload.value);
    console.log(`Added ICE candidate, peer id: ${peer.id}`, message);
  } catch (err) {
    if (!ignoreOffer) {
      console.error(err, message.payload.value);
    }
  }
};
