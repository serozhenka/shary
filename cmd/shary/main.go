package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/shary"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	room := shary.NewRoom()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "hello world"})
	})
	r.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"data": "Internal error"})
		}

		client := &shary.Client{
			Id:   ksuid.New().String(),
			Room: room,
			Conn: conn,
			Send: make(chan *shary.WsMessage),
		}

		room.Join(client)

		go client.Reader()
		go client.Writer()
	})

	r.Run("0.0.0.0:8000")
}
