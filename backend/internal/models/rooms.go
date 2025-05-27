package models

import "time"

// Room represents a video chat room
type Room struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerID   uint      `gorm:"not null" json:"owner_id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`

	// Relationships
	Owner        User          `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Participants []Participant `gorm:"foreignKey:RoomID" json:"participants,omitempty"`

	// Computed fields (not stored in DB)
	IsOwner bool `gorm:"-" json:"is_owner,omitempty"`
}

func (Room) TableName() string {
	return "rooms"
}

// Participant represents a user's participation in a room
type Participant struct {
	ID       uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID   uint      `gorm:"not null" json:"user_id"`
	RoomID   uint      `gorm:"not null" json:"room_id"`
	JoinedAt time.Time `gorm:"not null;default:now()" json:"joined_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Room Room `gorm:"foreignKey:RoomID" json:"room,omitempty"`
}

func (Participant) TableName() string {
	return "participants"
}
