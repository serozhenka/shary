import { Xid } from "xid-ts";
import { Peer } from "../../peer";
import { OutboundIceCandidateMessage } from "../outbound";

export const getOnIceCandidateHandler = (peer: Peer) => {
  return async ({ candidate }: RTCPeerConnectionIceEvent) => {
    if (candidate) {
      let iceCandidateMessage: OutboundIceCandidateMessage = {
        type: "iceCandidate",
        payload: {
          messageId: new Xid().toString(),
          value: candidate,
          clientId: peer.id,
        },
      };
      peer.ws!.send(JSON.stringify(iceCandidateMessage));
      console.log("Sent ice candidate message", iceCandidateMessage);
    }
  };
};
