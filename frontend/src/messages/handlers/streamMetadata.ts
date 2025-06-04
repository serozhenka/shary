import { InboundStreamMetadataMessage } from "../inbound";
import { registerStreamType } from "./ontrack";

interface StreamMetadataHandlerProps {
  message: InboundStreamMetadataMessage;
}

export const streamMetadataHandler = ({
  message,
}: StreamMetadataHandlerProps): void => {
  const { clientId, streamId, streamType } = message.payload;
  registerStreamType(clientId, streamId, streamType);
};
