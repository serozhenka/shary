package shary

import (
	"time"

	"github.com/gorilla/websocket"
)

const (
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

type Client struct {
	Id   string
	Room *Room
	Conn *websocket.Conn
	Send chan *WsMessage
}

type ClientMessage struct {
	Message string `json:"message"`
}

func (c *Client) Reader() {
	defer func() {
		c.Conn.Close()
		c.Room.Leave(c)
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(
		func(string) error {
			c.Conn.SetReadDeadline(time.Now().Add(pongWait))
			return nil
		},
	)

	for {
		var message ClientMessage
		err := c.Conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsCloseError(
				err,
				websocket.CloseNormalClosure,
				websocket.CloseGoingAway,
				websocket.CloseAbnormalClosure,
			) {
				break
			}

			continue
		}

		c.Room.Broadcast(c, &WsMessage{ClientId: c.Id, Message: message.Message})

	}
}

func (c *Client) Writer() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, nil)
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
