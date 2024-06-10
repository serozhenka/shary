package shary

import "github.com/serozhenka/shary/internal/shary/messages"

type Room struct {
	Clients map[*Client]bool
}

func NewRoom() *Room {
	return &Room{
		Clients: map[*Client]bool{},
	}
}

func (r *Room) Join(c *Client) {
	r.Clients[c] = true
	c.Broadcast(
		&messages.OutboundWsMessage{
			Type: messages.OutboudClientJoined,
			Payload: &messages.OutboundClientJoinedPayload{
				ClientId: c.Id,
			},
		},
	)
}

func (r *Room) Leave(c *Client) {
	delete(r.Clients, c)
}
