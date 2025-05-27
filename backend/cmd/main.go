package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/serozhenka/shary/internal/config"
	"github.com/serozhenka/shary/internal/database"
	"github.com/serozhenka/shary/internal/http/middlewares"
	"github.com/serozhenka/shary/internal/http/routes/auth"
	"github.com/serozhenka/shary/internal/http/routes/ping"
	"github.com/serozhenka/shary/internal/http/routes/rooms"
	"github.com/serozhenka/shary/internal/http/routes/ws"
	rrooms "github.com/serozhenka/shary/internal/repository/rooms"
	"github.com/serozhenka/shary/internal/services"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize services
	authService := services.NewAuthService(cfg.JWTSecret)

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	roomsRepo := rrooms.NewPostgresRepository(database.GetDB())
	meetingManager := ws.NewInMemoryMeetingManager()

	// Public routes
	ping.SetupRouter(r.Group("/ping"), &ping.RouterCtx{})
	auth.SetupRouter(r.Group("/auth"), &auth.RouterCtx{AuthService: authService})

	// WebSocket route (handles auth via query params)
	ws.SetupRouter(
		r.Group("/ws"),
		&ws.RouterCtx{
			RoomsRepo:      roomsRepo,
			MeetingManager: meetingManager,
			AuthService:    authService,
			Upgrader: &websocket.Upgrader{
				ReadBufferSize:  1024,
				WriteBufferSize: 1024,
				CheckOrigin: func(r *http.Request) bool {
					return true
				},
			},
		},
	)

	// Protected routes
	protected := r.Group("/")
	protected.Use(middlewares.AuthMiddleware(authService))

	auth.SetupProtectedRouter(protected.Group("/auth"), &auth.RouterCtx{AuthService: authService})
	rooms.SetupRouter(protected.Group("/rooms"), &rooms.RouterCtx{Repo: roomsRepo})

	// Run the server
	fmt.Printf("Starting server on 0.0.0.0:%s\n", cfg.Port)
	r.Run("0.0.0.0:" + cfg.Port)
}
