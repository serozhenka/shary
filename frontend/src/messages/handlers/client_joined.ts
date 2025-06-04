import { Xid } from "xid-ts";
import { bootstrapPeerConnection, ChatMessage, Peer } from "../../peer";
import { sendStreamMetadata } from "../../utils/streamMetadata";
import { InboundClientJoinedMessage } from "../inbound";
import { OutboundOfferMessage } from "../outbound";

interface ClientJoinedHandlerProps {
  message: InboundClientJoinedMessage;
  rtcConfig: RTCConfiguration;
  ws: WebSocket;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
  localStream: MediaStream;
  screenStream?: MediaStream | null;
  isScreenSharing?: boolean;
  onChatMessage?: (message: ChatMessage) => void;
}

export const clientJoinedHandler = async ({
  message,
  rtcConfig,
  ws,
  handlePeersChange,
  localStream,
  screenStream,
  isScreenSharing,
  onChatMessage,
}: ClientJoinedHandlerProps) => {
  const peer: Peer = {
    id: message.payload.clientId,
    username: message.payload.username,
    pc: new RTCPeerConnection(rtcConfig),
    ws: ws,
    remoteStream: new MediaStream(),
    remoteScreenStream: new MediaStream(),
    isPolite: false,
    makingOffer: false,
    audioMuted: false,
    videoMuted: false,
    isScreenSharing: false,
  };
  bootstrapPeerConnection(peer, handlePeersChange, onChatMessage);

  handlePeersChange((prevPeers) => [...prevPeers, peer]);

  localStream.getTracks().forEach((track) => {
    peer.pc.addTrack(track, localStream);
  });

  sendStreamMetadata(ws, localStream.id, "media");

  if (isScreenSharing && screenStream) {
    screenStream.getTracks().forEach((track) => {
      peer.pc.addTrack(track, screenStream);
    });

    sendStreamMetadata(ws, screenStream.id, "screen");
  }

  try {
    peer.makingOffer = true;
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(new RTCSessionDescription(offer));
    const offerMessage: OutboundOfferMessage = {
      type: "offer",
      payload: {
        messageId: new Xid().toString(),
        value: offer,
        clientId: peer.id,
      },
    };
    ws.send(JSON.stringify(offerMessage));
    console.log("Sent offer message", offerMessage.payload);
  } catch (err) {
    console.error(err);
  } finally {
    peer.makingOffer = false;
  }
};
