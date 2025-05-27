package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/serozhenka/shary/internal/services"
)

type RouterCtx struct {
	AuthService *services.AuthService
}

func SetupRouter(r *gin.RouterGroup, ctx *RouterCtx) {
	r.POST("/register", ctx.register)
	r.POST("/login", ctx.login)
}

func SetupProtectedRouter(r *gin.RouterGroup, ctx *RouterCtx) {
	r.GET("/me", ctx.me)
}

func (ctx *RouterCtx) register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	response, err := ctx.AuthService.Register(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

func (ctx *RouterCtx) login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	response, err := ctx.AuthService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (ctx *RouterCtx) me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	username, _ := c.Get("username")
	email, _ := c.Get("email")

	c.JSON(http.StatusOK, gin.H{
		"id":       userID,
		"username": username,
		"email":    email,
	})
}
