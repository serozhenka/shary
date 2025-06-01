package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/serozhenka/shary/internal/models"
	"github.com/serozhenka/shary/internal/repository/users"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	jwtSecret string
	userRepo  users.Repository
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func NewAuthService(jwtSecret string, userRepo users.Repository) *AuthService {
	return &AuthService{
		jwtSecret: jwtSecret,
		userRepo:  userRepo,
	}
}

func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	// Validate password length
	if len(req.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters long")
	}

	// Check if user already exists
	exists, err := s.userRepo.UserExistsByEmail(req.Email)
	if err != nil {
		return nil, errors.New("failed to check user existence")
	}
	if exists {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	// Create user
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
	}

	createdUser, err := s.userRepo.CreateUser(user)
	if err != nil {
		return nil, errors.New("failed to create user")
	}

	// Generate token
	token, err := s.GenerateToken(*createdUser)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  *createdUser,
	}, nil
}

func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	user, err := s.userRepo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.GenerateToken(*user)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) GenerateToken(user models.User) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
