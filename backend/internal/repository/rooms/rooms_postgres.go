package rooms

import (
	"errors"
	"fmt"

	"github.com/serozhenka/shary/internal/models"
	"gorm.io/gorm"
)

type postgresRepository struct {
	db *gorm.DB
}

// NewPostgresRepository creates a new PostgreSQL rooms repository
func NewPostgresRepository(db *gorm.DB) Repository {
	return &postgresRepository{
		db: db,
	}
}

// GetRoom retrieves a room by ID for a specific user
func (r *postgresRepository) GetRoom(userID uint, id uint) (*models.Room, error) {
	var room models.Room

	// Check if user is owner or participant
	err := r.db.Preload("Owner").Preload("Participants.User").
		Where("id = ? AND (owner_id = ? OR id IN (SELECT room_id FROM participants WHERE user_id = ?))",
			id, userID, userID).
		First(&room).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("room not found")
		}
		return nil, err
	}

	// Set IsOwner flag
	room.IsOwner = room.OwnerID == userID

	return &room, nil
}

// CreateRoom creates a new room with the user as owner
func (r *postgresRepository) CreateRoom(userID uint, name string) (*models.Room, error) {
	room := &models.Room{
		OwnerID: userID,
		Name:    name,
	}

	// Start transaction
	tx := r.db.Begin()

	// Create room
	if err := tx.Create(room).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Add owner as participant
	participant := &models.Participant{
		UserID: userID,
		RoomID: room.ID,
	}

	if err := tx.Create(participant).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	tx.Commit()

	// Load relationships
	r.db.Preload("Owner").Preload("Participants.User").First(room, room.ID)
	room.IsOwner = true

	return room, nil
}

// UpdateRoom updates a room's name (only if user is owner)
func (r *postgresRepository) UpdateRoom(userID uint, id uint, name string) (*models.Room, error) {
	var room models.Room

	// Check if user is owner
	err := r.db.Where("id = ? AND owner_id = ?", id, userID).First(&room).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("room not found or you don't have permission")
		}
		return nil, err
	}

	// Update room
	room.Name = name
	if err := r.db.Save(&room).Error; err != nil {
		return nil, err
	}

	// Load relationships
	r.db.Preload("Owner").Preload("Participants.User").First(&room, room.ID)
	room.IsOwner = true

	return &room, nil
}

// DeleteRoom removes a room (only if user is owner)
func (r *postgresRepository) DeleteRoom(userID uint, id uint) error {
	var room models.Room

	// Check if user is owner
	err := r.db.Where("id = ? AND owner_id = ?", id, userID).First(&room).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("room not found or you don't have permission")
		}
		return err
	}

	// Delete room (participants will be deleted by CASCADE)
	return r.db.Delete(&room).Error
}

// ListRooms returns all rooms where the user is a participant
func (r *postgresRepository) ListRooms(userID uint) ([]*models.Room, error) {
	var rooms []*models.Room

	// Get all rooms where user is a participant
	err := r.db.Preload("Owner").Preload("Participants.User").
		Joins("JOIN participants ON participants.room_id = rooms.id").
		Where("participants.user_id = ?", userID).
		Find(&rooms).Error

	if err != nil {
		return nil, err
	}

	// Set IsOwner flag for each room
	for _, room := range rooms {
		room.IsOwner = room.OwnerID == userID
	}

	return rooms, nil
}

// AddUserToRoom adds a user to a room by email (only if requester is owner)
func (r *postgresRepository) AddUserToRoom(ownerID uint, roomID uint, email string) error {
	// Check if requester is owner of the room
	var room models.Room
	err := r.db.Where("id = ? AND owner_id = ?", roomID, ownerID).First(&room).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("room not found or you don't have permission")
		}
		return err
	}

	// Find user by email
	var user models.User
	err = r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// User doesn't exist, but don't raise error as per requirements
			return nil
		}
		return err
	}

	// Check if user is already a participant
	var existingParticipant models.Participant
	err = r.db.Where("user_id = ? AND room_id = ?", user.ID, roomID).First(&existingParticipant).Error
	if err == nil {
		// User is already a participant
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	// Add user as participant
	participant := &models.Participant{
		UserID: user.ID,
		RoomID: roomID,
	}

	return r.db.Create(participant).Error
}

// GetRoomByStringID is a helper method for backward compatibility with string IDs
func (r *postgresRepository) GetRoomByStringID(userID uint, id string) (*models.Room, error) {
	// Try to parse string ID as uint
	var roomID uint
	if _, err := fmt.Sscanf(id, "%d", &roomID); err != nil {
		return nil, errors.New("invalid room ID format")
	}

	return r.GetRoom(userID, roomID)
}

// UpdateRoomByStringID is a helper method for backward compatibility with string IDs
func (r *postgresRepository) UpdateRoomByStringID(userID uint, id string, name string) (*models.Room, error) {
	var roomID uint
	if _, err := fmt.Sscanf(id, "%d", &roomID); err != nil {
		return nil, errors.New("invalid room ID format")
	}

	return r.UpdateRoom(userID, roomID, name)
}

// DeleteRoomByStringID is a helper method for backward compatibility with string IDs
func (r *postgresRepository) DeleteRoomByStringID(userID uint, id string) error {
	var roomID uint
	if _, err := fmt.Sscanf(id, "%d", &roomID); err != nil {
		return errors.New("invalid room ID format")
	}

	return r.DeleteRoom(userID, roomID)
}

// AddUserToRoomByStringID is a helper method for backward compatibility with string IDs
func (r *postgresRepository) AddUserToRoomByStringID(ownerID uint, id string, email string) error {
	var roomID uint
	if _, err := fmt.Sscanf(id, "%d", &roomID); err != nil {
		return errors.New("invalid room ID format")
	}

	return r.AddUserToRoom(ownerID, roomID, email)
}
