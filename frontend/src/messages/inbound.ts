import {
  CommonAnswerMessage,
  CommonDataMessage,
  CommonIceCandidateMessage,
  CommonOfferMessage,
  CommonTrackMutedMessage,
} from "./common";

export interface InboundInitMessage {
  type: "init";
  payload: {
    clients: Array<{ id: string; username: string }>;
  };
}

export interface InboundClientJoinedMessage {
  type: "client_joined";
  payload: {
    clientId: string;
    username: string;
  };
}

export interface InboundClientLeftMessage {
  type: "client_left";
  payload: {
    clientId: string;
  };
}

export interface InboundScreenShareStartedMessage {
  type: "screenShareStarted";
  payload: {
    clientId: string;
  };
}

export interface InboundScreenShareStoppedMessage {
  type: "screenShareStopped";
  payload: {
    clientId: string;
  };
}

export interface InboundStreamMetadataMessage {
  type: "streamMetadata";
  payload: {
    clientId: string;
    streamId: string;
    streamType: "media" | "screen";
  };
}

export type InboundOfferMessage = CommonOfferMessage;
export type InboundAnswerMessage = CommonAnswerMessage;
export type InboundDataMessage = CommonDataMessage;
export type InboundIceCandidateMessage = CommonIceCandidateMessage;
export type InboundTrackMutedMessage = CommonTrackMutedMessage;

export type InboundMessage =
  | InboundInitMessage
  | InboundClientJoinedMessage
  | InboundClientLeftMessage
  | InboundOfferMessage
  | InboundAnswerMessage
  | InboundDataMessage
  | InboundIceCandidateMessage
  | InboundTrackMutedMessage
  | InboundStreamMetadataMessage
  | InboundScreenShareStartedMessage
  | InboundScreenShareStoppedMessage;
