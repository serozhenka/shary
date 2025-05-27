package rooms

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func (r *RouterCtx) listRooms(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	rooms, err := r.Repo.ListRooms(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}

	// Serialize rooms to avoid React rendering issues
	serializedRooms := make([]gin.H, len(rooms))
	for i, room := range rooms {
		serializedRooms[i] = gin.H{
			"id":           strconv.FormatUint(uint64(room.ID), 10),
			"name":         room.Name,
			"created_at":   room.CreatedAt,
			"owner_id":     room.OwnerID,
			"is_owner":     room.IsOwner,
			"participants": len(room.Participants),
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": serializedRooms})
}

func (r *RouterCtx) getRoom(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	id := c.Param("id")
	room, err := r.Repo.GetRoomByStringID(userID.(uint), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":           strconv.FormatUint(uint64(room.ID), 10),
			"name":         room.Name,
			"created_at":   room.CreatedAt,
			"owner_id":     room.OwnerID,
			"is_owner":     room.IsOwner,
			"participants": len(room.Participants),
		},
	})
}

func (r *RouterCtx) createRoom(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	roomModel, err := r.Repo.CreateRoom(userID.(uint), req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{
			"id":           strconv.FormatUint(uint64(roomModel.ID), 10),
			"name":         roomModel.Name,
			"created_at":   roomModel.CreatedAt,
			"owner_id":     roomModel.OwnerID,
			"is_owner":     roomModel.IsOwner,
			"participants": len(roomModel.Participants),
		},
	})
}

func (r *RouterCtx) updateRoom(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	id := c.Param("id")
	var req UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	roomModel, err := r.Repo.UpdateRoomByStringID(userID.(uint), id, req.Name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found or permission denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"id":           strconv.FormatUint(uint64(roomModel.ID), 10),
			"name":         roomModel.Name,
			"created_at":   roomModel.CreatedAt,
			"owner_id":     roomModel.OwnerID,
			"is_owner":     roomModel.IsOwner,
			"participants": len(roomModel.Participants),
		},
	})
}

func (r *RouterCtx) deleteRoom(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	id := c.Param("id")
	err := r.Repo.DeleteRoomByStringID(userID.(uint), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found or permission denied"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "Room deleted"})
}

func (r *RouterCtx) addUserToRoom(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	id := c.Param("id")
	var req AddUserToRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	err := r.Repo.AddUserToRoomByStringID(userID.(uint), id, req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "User added to room successfully"})
}
