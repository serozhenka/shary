import { Peer } from "../../peer";

export const getOnIceConnectionStateChangeHandler = (peer: Peer) => {
  return async () => {
    if (peer.pc.iceConnectionState == "failed") {
      console.log(`Restarting ICE, client id: ${peer.id}`);
      peer.pc.restartIce();
    }
  };
};
