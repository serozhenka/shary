import { Peer } from "../../peer";
import { InboundClientLeftMessage } from "../inbound";

interface ClientLeftHandlerProps {
  message: InboundClientLeftMessage;
  handlePeersChange: (func: (prev: Peer[]) => Peer[]) => void;
}

export const clientLeftHandler = ({
  message,
  handlePeersChange,
}: ClientLeftHandlerProps) => {
  handlePeersChange((prevPeers) => {
    const peerLeft = prevPeers.find((p) => p.id === message.payload.clientId);
    if (!peerLeft) return prevPeers;

    peerLeft.pc.close();
    return prevPeers.filter((p) => p !== peerLeft);
  });
};
