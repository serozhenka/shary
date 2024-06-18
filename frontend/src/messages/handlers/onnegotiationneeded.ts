import { Xid } from "xid-ts";
import { OutboundOfferMessage } from "../outbound";
import { Peer } from "../../peer";

export const renegotiate = async (peer: Peer) => {
  try {
    peer.makingOffer = true;
    await peer.pc.setLocalDescription();

    let offerMessage: OutboundOfferMessage = {
      type: "offer",
      payload: {
        messageId: new Xid().toString(),
        value: peer.pc.localDescription!,
        clientId: peer.id,
      },
    };
    peer.ws!.send(JSON.stringify(offerMessage));
    console.log(
      "Sent offer message renegotiation",
      offerMessage.payload.value.type,
      offerMessage.payload
    );
  } catch (err) {
    console.error(err);
  } finally {
    peer.makingOffer = false;
  }
};

export const getOnNegotiationHandler = (peer: Peer) => {
  return async () => await renegotiate(peer);
};
