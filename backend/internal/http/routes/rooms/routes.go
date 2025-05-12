package rooms

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (r *RouterCtx) listRooms(c *gin.Context) {
	rooms := r.Repo.ListRooms()
	c.JSON(http.StatusOK, gin.H{"data": rooms})
}

func (r *RouterCtx) getRoom(c *gin.Context) {
	id := c.Param("id")
	room, err := r.Repo.GetRoom(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Get participant count and add it to the response
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":        room.ID,
			"name":      room.Name,
			"createdAt": room.CreatedAt,
		},
	})
}

func (r *RouterCtx) createRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	roomModel := r.Repo.CreateRoom(req.Name)
	c.JSON(http.StatusCreated, gin.H{"data": roomModel})
}

func (r *RouterCtx) updateRoom(c *gin.Context) {
	id := c.Param("id")
	var req UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	roomModel, err := r.Repo.UpdateRoom(id, req.Name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": roomModel})
}

func (r *RouterCtx) deleteRoom(c *gin.Context) {
	id := c.Param("id")
	err := r.Repo.DeleteRoom(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "Room deleted"})
}
