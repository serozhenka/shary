package rooms

import (
	"github.com/serozhenka/shary/internal/models"
)

type Repository interface {
	GetRoom(id string) (*models.Room, error)
	CreateRoom(name string) *models.Room
	UpdateRoom(id string, name string) (*models.Room, error)
	DeleteRoom(id string) error
	ListRooms() []*models.Room
}
