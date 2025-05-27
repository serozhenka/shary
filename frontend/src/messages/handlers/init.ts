import { Peer, bootstrapPeerConnection } from "../../peer";
import { InboundInitMessage } from "../inbound";

interface InitHandlerProps {
  message: InboundInitMessage;
  ws: WebSocket;
  rtcConfig: RTCConfiguration;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
  localStream: MediaStream;
}

export const initHandler = ({
  message,
  ws,
  rtcConfig,
  handlePeersChange,
  localStream,
}: InitHandlerProps) => {
  console.log("Init message", message.payload.clients.length);
  const peers = message.payload.clients.map((client) => {
    const peer: Peer = {
      id: client.id,
      username: client.username,
      pc: new RTCPeerConnection(rtcConfig),
      ws: ws,
      remoteStream: new MediaStream(),
      isPolite: true,
      makingOffer: false,
      audioMuted: false,
      videoMuted: false,
    };
    bootstrapPeerConnection(peer, handlePeersChange);
    return peer;
  });

  handlePeersChange((prevPeers) => {
    const newPeers = [...prevPeers, ...peers];
    localStream.getTracks().forEach((track) => {
      peers.forEach((peer) => {
        peer.pc.addTrack(track, localStream);
      });
    });
    return newPeers;
  });
};
