package rooms

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/models"
)

type inMemoryRepository struct {
	rooms map[string]*models.Room
	mutex sync.RWMutex
}

// NewInMemoryRepository creates a new in-memory rooms repository
func NewInMemoryRepository() Repository {
	return &inMemoryRepository{
		rooms: make(map[string]*models.Room),
	}
}

// GetRoom retrieves a room by ID (backward compatibility - ignores user context)
func (rm *inMemoryRepository) GetRoom(userID uint, id uint) (*models.Room, error) {
	return rm.GetRoomByStringID(userID, fmt.Sprintf("%d", id))
}

// GetRoomByStringID retrieves a room by string ID
func (rm *inMemoryRepository) GetRoomByStringID(userID uint, id string) (*models.Room, error) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	room, exists := rm.rooms[id]
	if !exists {
		return nil, errors.New("room not found")
	}
	return room, nil
}

// CreateRoom creates a new room with the given name
func (rm *inMemoryRepository) CreateRoom(userID uint, name string) (*models.Room, error) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	id := ksuid.New().String()
	room := &models.Room{
		ID:        0, // Will be converted to string ID for compatibility
		OwnerID:   userID,
		Name:      name,
		CreatedAt: time.Now(),
		IsOwner:   true,
	}
	rm.rooms[id] = room
	return room, nil
}

// UpdateRoom updates a room's name
func (rm *inMemoryRepository) UpdateRoom(userID uint, id uint, name string) (*models.Room, error) {
	return rm.UpdateRoomByStringID(userID, fmt.Sprintf("%d", id), name)
}

// UpdateRoomByStringID updates a room's name by string ID
func (rm *inMemoryRepository) UpdateRoomByStringID(userID uint, id string, name string) (*models.Room, error) {
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
func (rm *inMemoryRepository) DeleteRoom(userID uint, id uint) error {
	return rm.DeleteRoomByStringID(userID, fmt.Sprintf("%d", id))
}

// DeleteRoomByStringID removes a room by string ID
func (rm *inMemoryRepository) DeleteRoomByStringID(userID uint, id string) error {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	_, exists := rm.rooms[id]
	if !exists {
		return errors.New("room not found")
	}

	delete(rm.rooms, id)
	return nil
}

// ListRooms returns all rooms (ignores user context for backward compatibility)
func (rm *inMemoryRepository) ListRooms(userID uint) ([]*models.Room, error) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	rooms := make([]*models.Room, 0, len(rm.rooms))
	for _, room := range rm.rooms {
		rooms = append(rooms, room)
	}

	return rooms, nil
}

// AddUserToRoom adds a user to a room (no-op for in-memory implementation)
func (rm *inMemoryRepository) AddUserToRoom(ownerID uint, roomID uint, email string) error {
	// No-op for in-memory implementation
	return nil
}

// AddUserToRoomByStringID adds a user to a room by string ID (no-op for in-memory implementation)
func (rm *inMemoryRepository) AddUserToRoomByStringID(ownerID uint, id string, email string) error {
	// No-op for in-memory implementation
	return nil
}

// Legacy methods for backward compatibility with old string-based interface

// LegacyGetRoom retrieves a room by string ID (old interface)
func (rm *inMemoryRepository) LegacyGetRoom(id string) (*models.Room, error) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	room, exists := rm.rooms[id]
	if !exists {
		return nil, errors.New("room not found")
	}
	return room, nil
}

// LegacyCreateRoom creates a new room with the given name (old interface)
func (rm *inMemoryRepository) LegacyCreateRoom(name string) *models.Room {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	id := ksuid.New().String()
	room := &models.Room{
		ID:        0, // Will be converted to string ID for compatibility
		Name:      name,
		CreatedAt: time.Now(),
	}
	rm.rooms[id] = room
	return room
}

// LegacyUpdateRoom updates a room's name (old interface)
func (rm *inMemoryRepository) LegacyUpdateRoom(id string, name string) (*models.Room, error) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	room, exists := rm.rooms[id]
	if !exists {
		return nil, errors.New("room not found")
	}

	room.Name = name
	return room, nil
}

// LegacyDeleteRoom removes a room (old interface)
func (rm *inMemoryRepository) LegacyDeleteRoom(id string) error {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	_, exists := rm.rooms[id]
	if !exists {
		return errors.New("room not found")
	}

	delete(rm.rooms, id)
	return nil
}

// LegacyListRooms returns all rooms (old interface)
func (rm *inMemoryRepository) LegacyListRooms() []*models.Room {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	rooms := make([]*models.Room, 0, len(rm.rooms))
	for _, room := range rm.rooms {
		rooms = append(rooms, room)
	}

	return rooms
}
