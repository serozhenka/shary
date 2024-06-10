package messages

type OutboundMessageType string

const (
	OutboudInit         OutboundMessageType = "init"
	OutboudClientJoined OutboundMessageType = "client_joined"
	OutboudClientLeft   OutboundMessageType = "client_left"
	OutboudOffer        OutboundMessageType = "offer"
	OutboudAnswer       OutboundMessageType = "answer"
	OutboudData         OutboundMessageType = "data"
)

type OutboundWsMessage struct {
	Type    OutboundMessageType `json:"type"`
	Payload interface{}         `json:"payload"`
}

type InitClient struct {
	Id string `json:"id"`
}

type OutboundInitPayload struct {
	Clients []InitClient `json:"clients"`
}

type OutboundClientJoinedPayload struct {
	ClientId string `json:"clientId"`
}

type OutboundClientLeftPayload struct {
	ClientId string `json:"clientId"`
}

type OutboundOfferPayload struct {
	Value struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
	ClientId string `json:"clientId"`
}

type OutboundAnswerPayload struct {
	ClientId string `json:"clientId"`
	Value    struct {
		Type string `json:"type"`
		Sdp  string `json:"sdp"`
	} `json:"value"`
}
