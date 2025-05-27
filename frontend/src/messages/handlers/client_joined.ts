import { Xid } from "xid-ts";
import { Peer, bootstrapPeerConnection } from "../../peer";
import { InboundClientJoinedMessage } from "../inbound";
import { OutboundOfferMessage } from "../outbound";

interface ClientJoinedHandlerProps {
  message: InboundClientJoinedMessage;
  rtcConfig: RTCConfiguration;
  ws: WebSocket;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
  localStream: MediaStream;
}

export const clientJoinedHandler = async ({
  message,
  rtcConfig,
  ws,
  handlePeersChange,
  localStream,
}: ClientJoinedHandlerProps) => {
  const peer: Peer = {
    id: message.payload.clientId,
    username: message.payload.username,
    pc: new RTCPeerConnection(rtcConfig),
    ws: ws,
    remoteStream: new MediaStream(),
    isPolite: false,
    makingOffer: false,
    audioMuted: false,
    videoMuted: false,
  };
  bootstrapPeerConnection(peer, handlePeersChange);

  handlePeersChange((prevPeers) => [...prevPeers, peer]);

  localStream.getTracks().forEach((track) => {
    peer.pc.addTrack(track, localStream);
  });

  try {
    peer.makingOffer = true;
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(new RTCSessionDescription(offer));
    let offerMessage: OutboundOfferMessage = {
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
