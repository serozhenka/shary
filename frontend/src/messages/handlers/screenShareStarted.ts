import { Peer } from "../../peer";
import { InboundScreenShareStartedMessage } from "../inbound";

interface ScreenShareStartedHandlerProps {
  message: InboundScreenShareStartedMessage;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
}

export const screenShareStartedHandler = ({
  message,
  handlePeersChange,
}: ScreenShareStartedHandlerProps): void => {
  handlePeersChange((prevPeers) => {
    return prevPeers.map((peer) => {
      if (peer.id === message.payload.clientId) {
        return { ...peer, isScreenSharing: true };
      }
      return peer;
    });
  });
};
