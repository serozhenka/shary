package users

import (
	"fmt"
	"sync"

	"github.com/serozhenka/shary/internal/models"
)

type inMemoryRepository struct {
	users  []models.User
	nextID uint
	mutex  sync.RWMutex
}

// NewInMemoryRepository creates a new in-memory user repository
func NewInMemoryRepository() Repository {
	return &inMemoryRepository{
		users:  make([]models.User, 0),
		nextID: 1,
	}
}

func (r *inMemoryRepository) CreateUser(user models.User) (*models.User, error) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	user.ID = r.nextID
	r.nextID++
	r.users = append(r.users, user)
	return &user, nil
}

func (r *inMemoryRepository) GetUserByEmail(email string) (*models.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, user := range r.users {
		if user.Email == email {
			userCopy := user
			return &userCopy, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (r *inMemoryRepository) GetUserByID(id uint) (*models.User, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, user := range r.users {
		if user.ID == id {
			userCopy := user
			return &userCopy, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (r *inMemoryRepository) UserExistsByEmail(email string) (bool, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	for _, user := range r.users {
		if user.Email == email {
			return true, nil
		}
	}
	return false, nil
}
