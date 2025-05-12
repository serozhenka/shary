package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/serozhenka/shary/internal/http/middlewares"
	"github.com/serozhenka/shary/internal/http/routes/ping"
	"github.com/serozhenka/shary/internal/http/routes/rooms"
	"github.com/serozhenka/shary/internal/http/routes/ws"
	rrooms "github.com/serozhenka/shary/internal/repository/rooms"
)

func main() {
	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	roomsRepo := rrooms.NewInMemoryRepository()
	roomsRepo.CreateRoom("General")
	meetingManager := ws.NewInMemoryMeetingManager()

	ping.SetupRouter(r.Group("/ping"), &ping.RouterCtx{})
	ws.SetupRouter(
		r.Group("/ws"),
		&ws.RouterCtx{
			RoomsRepo:      roomsRepo,
			MeetingManager: meetingManager,
			Upgrader: &websocket.Upgrader{
				ReadBufferSize:  1024,
				WriteBufferSize: 1024,
				CheckOrigin: func(r *http.Request) bool {
					return true
				},
			},
		},
	)
	rooms.SetupRouter(r.Group("/rooms"), &rooms.RouterCtx{Repo: roomsRepo})

	// Run the server
	fmt.Println("Starting server on 0.0.0.0:8000")
	r.Run("0.0.0.0:8000")
}
