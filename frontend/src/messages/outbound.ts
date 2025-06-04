import {
  CommonAnswerMessage,
  CommonDataMessage,
  CommonIceCandidateMessage,
  CommonOfferMessage,
  CommonTrackMutedMessage,
  CommonTrackUnmutedMessage,
} from "./common";

export interface OutboundDataMessage extends CommonDataMessage {}
export interface OutboundOfferMessage extends CommonOfferMessage {}
export interface OutboundAnswerMessage extends CommonAnswerMessage {}
export interface OutboundIceCandidateMessage
  extends CommonIceCandidateMessage {}

export interface OutboundTrackMutedMessage extends CommonTrackMutedMessage {
  payload: {
    trackKind: "audio" | "video";
  };
}

export interface OutboundTrackUnmutedMessage extends CommonTrackUnmutedMessage {
  payload: {
    trackKind: "audio" | "video";
  };
}

export interface OutboundScreenShareStartedMessage {
  type: "screenShareStarted";
  payload: Record<string, never>;
}

export interface OutboundScreenShareStoppedMessage {
  type: "screenShareStopped";
  payload: Record<string, never>;
}

export interface OutboundStreamMetadataMessage {
  type: "streamMetadata";
  payload: {
    streamId: string;
    streamType: "media" | "screen";
  };
}

export type OutboundMessage =
  | OutboundDataMessage
  | OutboundOfferMessage
  | OutboundAnswerMessage
  | OutboundIceCandidateMessage
  | OutboundTrackMutedMessage
  | OutboundTrackUnmutedMessage
  | OutboundStreamMetadataMessage
  | OutboundScreenShareStartedMessage
  | OutboundScreenShareStoppedMessage;
