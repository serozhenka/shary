package messages

import "encoding/json"

type InboundWsMessage struct {
	Type    InboundMessageType `json:"type"`
	Payload json.RawMessage    `json:"payload"`
}

type InboundDataPayload struct {
	Message string `json:"message"`
}

type InboundOfferPayload struct {
	MessageId string `json:"messageId"`
	Value     struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
	ClientId string `json:"clientId"`
}

type InboundAnswerPayload struct {
	MessageId string `json:"messageId"`
	ClientId  string `json:"clientId"`
	Value     struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
}

type InboundIceCandidatePayload struct {
	MessageId string         `json:"messageId"`
	ClientId  string         `json:"clientId"`
	Value     map[string]any `json:"value"`
}

type InboundTrackMutedPayload struct {
	TrackKind string `json:"trackKind"`
}

type InboundStreamMetadataPayload struct {
	StreamId   string `json:"streamId"`
	StreamType string `json:"streamType"` // "media" | "screen"
}

type InboundScreenShareStartedPayload struct{}

type InboundScreenShareStoppedPayload struct{}

type InboundMessageType string

const (
	InboundOffer              InboundMessageType = "offer"
	InboundAnswer             InboundMessageType = "answer"
	InboundData               InboundMessageType = "data"
	InboundIceCandidate       InboundMessageType = "iceCandidate"
	InboundTrackMuted         InboundMessageType = "trackMuted"
	InboundStreamMetadata     InboundMessageType = "streamMetadata"
	InboundScreenShareStarted InboundMessageType = "screenShareStarted"
	InboundScreenShareStopped InboundMessageType = "screenShareStopped"
)

var InboundPayload = map[InboundMessageType]func() any{
	InboundOffer:              func() any { return &InboundOfferPayload{} },
	InboundAnswer:             func() any { return &InboundAnswerPayload{} },
	InboundData:               func() any { return &InboundDataPayload{} },
	InboundIceCandidate:       func() any { return &InboundIceCandidatePayload{} },
	InboundTrackMuted:         func() any { return &InboundTrackMutedPayload{} },
	InboundStreamMetadata:     func() any { return &InboundStreamMetadataPayload{} },
	InboundScreenShareStarted: func() any { return &InboundScreenShareStartedPayload{} },
	InboundScreenShareStopped: func() any { return &InboundScreenShareStoppedPayload{} },
}
