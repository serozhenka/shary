package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/serozhenka/shary/internal/http/middlewares"
	authRoutes "github.com/serozhenka/shary/internal/http/routes/auth"
	roomRoutes "github.com/serozhenka/shary/internal/http/routes/rooms"
	"github.com/serozhenka/shary/internal/models"
	"github.com/serozhenka/shary/internal/repository/rooms"
	"github.com/serozhenka/shary/internal/repository/users"
	"github.com/serozhenka/shary/internal/services"
	"github.com/stretchr/testify/suite"
)

type TestSuite struct {
	suite.Suite
	router      *gin.Engine
	authService *services.AuthService
	roomRepo    rooms.Repository
	userRepo    users.Repository
}

func (suite *TestSuite) SetupSuite() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Initialize in-memory repositories
	suite.userRepo = users.NewInMemoryRepository()
	suite.roomRepo = rooms.NewInMemoryRepository()

	// Initialize services
	suite.authService = services.NewAuthService("test-jwt-secret-key-for-testing-only", suite.userRepo)

	// Setup router
	suite.setupRouter()
}

func (suite *TestSuite) SetupTest() {
	// Clean up by creating fresh repositories before each test
	suite.userRepo = users.NewInMemoryRepository()
	suite.roomRepo = rooms.NewInMemoryRepository()

	// Re-initialize auth service with fresh user repository
	suite.authService = services.NewAuthService("test-jwt-secret-key-for-testing-only", suite.userRepo)

	// Re-setup router with fresh repositories
	suite.setupRouter()
}

func (suite *TestSuite) TearDownTest() {
	// No cleanup needed for in-memory repositories
}

func (suite *TestSuite) TearDownSuite() {
	// No cleanup needed for in-memory repositories
}

func (suite *TestSuite) setupRouter() {
	router := gin.New()
	router.Use(gin.Recovery())

	// Auth routes
	authGroup := router.Group("/auth")
	authCtx := &authRoutes.RouterCtx{
		AuthService: suite.authService,
	}
	authRoutes.SetupRouter(authGroup, authCtx)

	// Protected auth routes
	protectedAuthGroup := router.Group("/auth")
	protectedAuthGroup.Use(middlewares.AuthMiddleware(suite.authService))
	authRoutes.SetupProtectedRouter(protectedAuthGroup, authCtx)

	// Room routes (all protected)
	roomGroup := router.Group("/rooms")
	roomGroup.Use(middlewares.AuthMiddleware(suite.authService))
	roomCtx := &roomRoutes.RouterCtx{
		Repo: suite.roomRepo,
	}
	roomRoutes.SetupRouter(roomGroup, roomCtx)

	suite.router = router
}

// Helper methods for testing
func (suite *TestSuite) createTestUser(username, email, password string) *models.User {
	req := services.RegisterRequest{
		Username: username,
		Email:    email,
		Password: password,
	}

	response, err := suite.authService.Register(req)
	suite.Require().NoError(err)

	return &response.User
}

func (suite *TestSuite) loginTestUser(email, password string) string {
	req := services.LoginRequest{
		Email:    email,
		Password: password,
	}

	response, err := suite.authService.Login(req)
	suite.Require().NoError(err)

	return response.Token
}

func (suite *TestSuite) createTestRoom(ownerID uint, name string) *models.Room {
	room, err := suite.roomRepo.CreateRoom(ownerID, name)
	suite.Require().NoError(err)
	return room
}

func (suite *TestSuite) makeRequest(method, url string, body interface{}, token string) (*httptest.ResponseRecorder, error) {
	var requestBody []byte
	var err error

	if body != nil {
		requestBody, err = json.Marshal(body)
		if err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	return w, nil
}

func (suite *TestSuite) addUserToRoom(roomID uint, userEmail string) {
	err := suite.roomRepo.AddUserToRoomByStringID(1, fmt.Sprintf("%d", roomID), userEmail)
	suite.Require().NoError(err)
}
