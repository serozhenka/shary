package rooms

import (
	"github.com/serozhenka/shary/internal/models"
)

type Repository interface {
	GetRoom(userID uint, id uint) (*models.Room, error)
	CreateRoom(userID uint, name string) (*models.Room, error)
	UpdateRoom(userID uint, id uint, name string) (*models.Room, error)
	DeleteRoom(userID uint, id uint) error
	ListRooms(userID uint) ([]*models.Room, error)
	AddUserToRoom(ownerID uint, roomID uint, email string) error

	// Backward compatibility methods for string IDs
	GetRoomByStringID(userID uint, id string) (*models.Room, error)
	UpdateRoomByStringID(userID uint, id string, name string) (*models.Room, error)
	DeleteRoomByStringID(userID uint, id string) error
	AddUserToRoomByStringID(ownerID uint, id string, email string) error
}
