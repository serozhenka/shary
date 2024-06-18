import { Peer } from "../../peer";
import { InboundAnswerMessage } from "../inbound";

interface AnswerHandlerProps {
  message: InboundAnswerMessage;
  peers: Peer[];
}

export const answerHandler = async ({ message, peers }: AnswerHandlerProps) => {
  console.log("Received answer message", message.payload);

  const peer = peers.find((p) => p.id == message.payload.clientId);
  if (!peer) {
    console.log(`No client matches given ID: ${message.payload.clientId}`);
    return;
  }

  try {
    await peer.pc.setRemoteDescription(message.payload.value);
  } catch (err) {
    console.error(err);
    return;
  }
};
