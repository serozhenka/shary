interface ClientProps {
  id: string;
  isPolite: boolean;
  peerConnection?: RTCPeerConnection;
  ws?: WebSocket;
  makingOffer?: boolean;
}

export class Client {
  id: string;
  peerConnection?: RTCPeerConnection;
  ws?: WebSocket;
  isPolite: boolean;
  makingOffer: boolean;
  testAttr: boolean;

  constructor({ id, peerConnection, ws, isPolite, makingOffer }: ClientProps) {
    this.id = id;
    this.peerConnection = peerConnection;
    this.ws = ws;
    this.isPolite = isPolite;
    this.makingOffer = makingOffer || false;
    this.testAttr = this.makingOffer;
  }
}
