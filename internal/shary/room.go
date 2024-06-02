package shary

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
}

func (r *Room) Leave(c *Client) {
	delete(r.Clients, c)
}

func (r *Room) Broadcast(sender *Client, m *WsMessage) {
	for c := range r.Clients {
		if c != sender {
			c.Send <- m
		}
	}
}
