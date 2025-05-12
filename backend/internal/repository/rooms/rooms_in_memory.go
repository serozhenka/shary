package rooms

import (
	"errors"
	"sync"
	"time"

	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/models"
)

type inMemoryRepository struct {
	rooms map[string]*models.Room
	mutex sync.RWMutex
}

// NewRoomsManager creates a new rooms manager
func NewInMemoryRepository() Repository {
	return &inMemoryRepository{
		rooms: make(map[string]*models.Room),
	}
}

// GetRoom retrieves a room by ID
func (rm *inMemoryRepository) GetRoom(id string) (*models.Room, error) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	room, exists := rm.rooms[id]
	if !exists {
		return nil, errors.New("room not found")
	}
	return room, nil
}

// CreateRoom creates a new room with the given name
func (rm *inMemoryRepository) CreateRoom(name string) *models.Room {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	id := ksuid.New().String()
	room := &models.Room{
		ID:        id,
		Name:      name,
		CreatedAt: time.Now(),
	}
	rm.rooms[id] = room
	return room
}

// UpdateRoom updates a room's name
func (rm *inMemoryRepository) UpdateRoom(id string, name string) (*models.Room, error) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	room, exists := rm.rooms[id]
	if !exists {
		return nil, errors.New("room not found")
	}

	room.Name = name
	return room, nil
}

// DeleteRoom removes a room
func (rm *inMemoryRepository) DeleteRoom(id string) error {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	_, exists := rm.rooms[id]
	if !exists {
		return errors.New("room not found")
	}

	delete(rm.rooms, id)
	return nil
}

// ListRooms returns all rooms
func (rm *inMemoryRepository) ListRooms() []*models.Room {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	models := make([]*models.Room, 0, len(rm.rooms))
	for _, room := range rm.rooms {
		models = append(models, room)
	}

	return models
}
