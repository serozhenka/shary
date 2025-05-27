package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Username     string    `gorm:"size:50;not null;uniqueIndex" json:"username"`
	Email        string    `gorm:"size:100;not null;uniqueIndex" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"`
	CreatedAt    time.Time `gorm:"not null;default:now()" json:"created_at"`
}

func (User) TableName() string {
	return "users"
}
