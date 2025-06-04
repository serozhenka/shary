import { bootstrapPeerConnection, ChatMessage, Peer } from "../../peer";
import { sendStreamMetadata } from "../../utils/streamMetadata";
import { InboundInitMessage } from "../inbound";

interface InitHandlerProps {
  message: InboundInitMessage;
  ws: WebSocket;
  rtcConfig: RTCConfiguration;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
  localStream: MediaStream;
  onChatMessage?: (message: ChatMessage) => void;
}

export const initHandler = ({
  message,
  ws,
  rtcConfig,
  handlePeersChange,
  localStream,
  onChatMessage,
}: InitHandlerProps) => {
  console.log("Init message", message.payload.clients.length);
  const peers = message.payload.clients.map((client) => {
    const peer: Peer = {
      id: client.id,
      username: client.username,
      pc: new RTCPeerConnection(rtcConfig),
      ws: ws,
      remoteStream: new MediaStream(),
      remoteScreenStream: new MediaStream(),
      isPolite: true,
      makingOffer: false,
      audioMuted: false,
      videoMuted: false,
      isScreenSharing: false,
    };
    bootstrapPeerConnection(peer, handlePeersChange, onChatMessage);
    return peer;
  });

  handlePeersChange((prevPeers) => {
    const newPeers = [...prevPeers, ...peers];

    localStream.getTracks().forEach((track) => {
      peers.forEach((peer) => {
        peer.pc.addTrack(track, localStream);
      });
    });

    sendStreamMetadata(ws, localStream.id, "media");

    return newPeers;
  });
};
