package ws

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/messages"
)

func (ctx *RouterCtx) ws(c *gin.Context) {
	// Get roomId from query parameters, default to the first room if not specified
	roomId := c.Query("roomId")
	if roomId == "" {
		rooms := ctx.RoomsRepo.ListRooms()
		if len(rooms) > 0 {
			roomId = rooms[0].ID
		} else {
			// Create a default room if none exists
			roomModel := ctx.RoomsRepo.CreateRoom("Default Room")
			roomId = roomModel.ID
		}
	}

	meet := ctx.MeetingManager.GetMeeting(roomId)
	if meet == nil {
		meet = ctx.MeetingManager.CreateMeeting(roomId)
	}

	// Upgrade the connection to WebSocket
	conn, err := ctx.Upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal error"})
		return
	}

	// Create client and join room
	client := &Client{
		Id:       ksuid.New().String(),
		Conn:     conn,
		Messages: make(chan *messages.OutboundWsMessage, 1024),
	}

	meet.Join(client)

	go client.Reader(meet)
	go client.Writer()
}
