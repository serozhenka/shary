import { OutboundStreamMetadataMessage } from "../messages/outbound";

export const sendStreamMetadata = (
  ws: WebSocket,
  streamId: string,
  streamType: "media" | "screen"
) => {
  const message: OutboundStreamMetadataMessage = {
    type: "streamMetadata",
    payload: {
      streamId,
      streamType,
    },
  };

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log("Sent stream metadata:", {
      streamId,
      streamType,
      websocketReadyState: ws.readyState,
    });
  } else {
    console.warn(
      "WebSocket not open when trying to send stream metadata:",
      ws.readyState
    );
  }
};
