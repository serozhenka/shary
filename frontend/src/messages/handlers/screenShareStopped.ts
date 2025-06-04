import { Peer } from "../../peer";
import { InboundScreenShareStoppedMessage } from "../inbound";

interface ScreenShareStoppedHandlerProps {
  message: InboundScreenShareStoppedMessage;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
}

export const screenShareStoppedHandler = ({
  message,
  handlePeersChange,
}: ScreenShareStoppedHandlerProps): void => {
  handlePeersChange((prevPeers) => {
    return prevPeers.map((peer) => {
      if (peer.id === message.payload.clientId) {
        return { ...peer, isScreenSharing: false };
      }
      return peer;
    });
  });
};
