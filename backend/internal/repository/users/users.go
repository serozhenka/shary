package users

import "github.com/serozhenka/shary/internal/models"

// Repository defines the interface for user data operations
type Repository interface {
	CreateUser(user models.User) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id uint) (*models.User, error)
	UserExistsByEmail(email string) (bool, error)
}
