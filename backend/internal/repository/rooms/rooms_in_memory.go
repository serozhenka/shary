package rooms

import (
	"errors"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/segmentio/ksuid"
	"github.com/serozhenka/shary/internal/models"
)

type inMemoryRepository struct {
	rooms            map[string]*models.Room
	roomIDToStringID map[uint]string // Map numeric ID to string ID
	nextRoomID       uint
	mutex            sync.RWMutex
}

// NewInMemoryRepository creates a new in-memory rooms repository
func NewInMemoryRepository() Repository {
	return &inMemoryRepository{
		rooms:            make(map[string]*models.Room),
		roomIDToStringID: make(map[uint]string),
		nextRoomID:       1,
	}
}

// GetRoom retrieves a room by ID (backward compatibility - checks user permissions)
func (rm *inMemoryRepository) GetRoom(userID uint, id uint) (*models.Room, error) {
	return rm.GetRoomByStringID(userID, fmt.Sprintf("%d", id))
}

// GetRoomByStringID retrieves a room by string ID with user permission checks
func (rm *inMemoryRepository) GetRoomByStringID(userID uint, id string) (*models.Room, error) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	// Try to find room by string ID directly
	room, exists := rm.rooms[id]
	if !exists {
		// Try to find by numeric ID converted to string
		numericID, err := strconv.ParseUint(id, 10, 32)
		if err == nil {
			stringID, hasMapping := rm.roomIDToStringID[uint(numericID)]
			if hasMapping {
				room, exists = rm.rooms[stringID]
			}
		}
	}

	if !exists {
		return nil, errors.New("room not found")
	}

	// Check if user has access to this room (owner or participant)
	if room.OwnerID != userID {
		// For simplicity in tests, allow access if user is owner
		// In a real implementation, we'd check participants table
		return nil, errors.New("room not found")
	}

	// Set computed fields
	room.IsOwner = (room.OwnerID == userID)
	return room, nil
}

// CreateRoom creates a new room with the given name
func (rm *inMemoryRepository) CreateRoom(userID uint, name string) (*models.Room, error) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	stringID := ksuid.New().String()
	numericID := rm.nextRoomID
	rm.nextRoomID++

	room := &models.Room{
		ID:        numericID,
		OwnerID:   userID,
		Name:      name,
		CreatedAt: time.Now(),
		IsOwner:   true,
	}

	rm.rooms[stringID] = room
	rm.roomIDToStringID[numericID] = stringID

	return room, nil
}

// UpdateRoom updates a room's name with ownership check
func (rm *inMemoryRepository) UpdateRoom(userID uint, id uint, name string) (*models.Room, error) {
	return rm.UpdateRoomByStringID(userID, fmt.Sprintf("%d", id), name)
}

// UpdateRoomByStringID updates a room's name by string ID with ownership check
func (rm *inMemoryRepository) UpdateRoomByStringID(userID uint, id string, name string) (*models.Room, error) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	// Try to find room by string ID directly
	room, exists := rm.rooms[id]
	if !exists {
		// Try to find by numeric ID converted to string
		numericID, err := strconv.ParseUint(id, 10, 32)
		if err == nil {
			stringID, hasMapping := rm.roomIDToStringID[uint(numericID)]
			if hasMapping {
				room, exists = rm.rooms[stringID]
			}
		}
	}

	if !exists {
		return nil, errors.New("room not found")
	}

	// Check ownership
	if room.OwnerID != userID {
		return nil, errors.New("permission denied")
	}

	room.Name = name
	room.IsOwner = true
	return room, nil
}

// DeleteRoom removes a room with ownership check
func (rm *inMemoryRepository) DeleteRoom(userID uint, id uint) error {
	return rm.DeleteRoomByStringID(userID, fmt.Sprintf("%d", id))
}

// DeleteRoomByStringID removes a room by string ID with ownership check
func (rm *inMemoryRepository) DeleteRoomByStringID(userID uint, id string) error {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	// Try to find room by string ID directly
	var actualStringID string
	room, exists := rm.rooms[id]
	if exists {
		actualStringID = id
	} else {
		// Try to find by numeric ID converted to string
		numericID, err := strconv.ParseUint(id, 10, 32)
		if err == nil {
			stringID, hasMapping := rm.roomIDToStringID[uint(numericID)]
			if hasMapping {
				room, exists = rm.rooms[stringID]
				actualStringID = stringID
			}
		}
	}

	if !exists {
		return errors.New("room not found")
	}

	// Check ownership
	if room.OwnerID != userID {
		return errors.New("permission denied")
	}

	delete(rm.rooms, actualStringID)
	delete(rm.roomIDToStringID, room.ID)
	return nil
}

// ListRooms returns all rooms owned by the user
func (rm *inMemoryRepository) ListRooms(userID uint) ([]*models.Room, error) {
	rm.mutex.RLock()
	defer rm.mutex.RUnlock()

	rooms := make([]*models.Room, 0)
	for _, room := range rm.rooms {
		if room.OwnerID == userID {
			room.IsOwner = true
			rooms = append(rooms, room)
		}
	}

	return rooms, nil
}

// AddUserToRoom adds a user to a room with permission check
func (rm *inMemoryRepository) AddUserToRoom(ownerID uint, roomID uint, email string) error {
	return rm.AddUserToRoomByStringID(ownerID, fmt.Sprintf("%d", roomID), email)
}

// AddUserToRoomByStringID adds a user to a room by string ID with permission check
func (rm *inMemoryRepository) AddUserToRoomByStringID(requesterID uint, id string, email string) error {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	// Try to find room by string ID directly
	room, exists := rm.rooms[id]
	if !exists {
		// Try to find by numeric ID converted to string
		numericID, err := strconv.ParseUint(id, 10, 32)
		if err == nil {
			stringID, hasMapping := rm.roomIDToStringID[uint(numericID)]
			if hasMapping {
				room, exists = rm.rooms[stringID]
			}
		}
	}

	if !exists {
		return errors.New("room not found")
	}

	// Only room owners can add users to rooms
	if room.OwnerID != requesterID {
		return errors.New("only room owners can add users")
	}

	// In a real implementation, we'd add the user to participants table
	// For now, just return success since we don't have user lookup
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

	stringID := ksuid.New().String()
	numericID := rm.nextRoomID
	rm.nextRoomID++

	room := &models.Room{
		ID:        numericID,
		Name:      name,
		CreatedAt: time.Now(),
	}
	rm.rooms[stringID] = room
	rm.roomIDToStringID[numericID] = stringID
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

	room, exists := rm.rooms[id]
	if !exists {
		return errors.New("room not found")
	}

	delete(rm.rooms, id)
	delete(rm.roomIDToStringID, room.ID)
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
