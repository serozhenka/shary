import { Xid } from "xid-ts";
import { Peer } from "../../peer";
import { InboundOfferMessage } from "../inbound";
import { OutboundAnswerMessage } from "../outbound";

interface OfferHandlerProps {
  message: InboundOfferMessage;
  peers: Peer[];
}

export const offerHandler = async ({ message, peers }: OfferHandlerProps) => {
  console.log("Received offer message", message.payload);

  const peer = peers.find((p) => p.id == message.payload.clientId);
  if (!peer) {
    console.log(`No client matches given ID: ${message.payload.clientId}`);
    return;
  }

  const offerCollision = peer.makingOffer || peer.pc.signalingState != "stable";
  const ignoreOffer = offerCollision && !peer.isPolite;
  if (ignoreOffer) {
    console.log(`Impolite peer: ${peer.id}. Ignoring answer`);
    return;
  }

  try {
    await peer.pc.setRemoteDescription(message.payload.value);
    await peer.pc.setLocalDescription();
  } catch (err) {
    console.error(err);
    return;
  }

  let answerMessage: OutboundAnswerMessage = {
    type: "answer",
    payload: {
      messageId: new Xid().toString(),
      value: peer.pc.localDescription!,
      clientId: message.payload.clientId,
    },
  };
  peer.ws.send(JSON.stringify(answerMessage));
  console.log("Sent answer message", answerMessage.payload);
};
