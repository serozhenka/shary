package tests

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/serozhenka/shary/internal/services"
	"github.com/stretchr/testify/suite"
)

type AuthTestSuite struct {
	TestSuite
}

func TestAuthTestSuite(t *testing.T) {
	suite.Run(t, new(AuthTestSuite))
}

// Test 1: Registration
func (suite *AuthTestSuite) TestRegistration() {
	tests := []struct {
		name           string
		requestBody    services.RegisterRequest
		expectedStatus int
		expectError    bool
	}{
		{
			name: "successful_registration",
			requestBody: services.RegisterRequest{
				Username: "testuser",
				Email:    "test@example.com",
				Password: "password123",
			},
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name: "registration_with_short_password",
			requestBody: services.RegisterRequest{
				Username: "testuser2",
				Email:    "test2@example.com",
				Password: "short",
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "registration_with_invalid_email",
			requestBody: services.RegisterRequest{
				Username: "testuser3",
				Email:    "invalid-email",
				Password: "password123",
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
		{
			name: "registration_with_duplicate_email",
			requestBody: services.RegisterRequest{
				Username: "testuser4",
				Email:    "duplicate@example.com",
				Password: "password123",
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			// Create first user for duplicate email test using direct API call
			if tt.name == "registration_with_duplicate_email" {
				firstUserRequest := services.RegisterRequest{
					Username: "firstuser",
					Email:    "duplicate@example.com",
					Password: "password123",
				}
				w, err := suite.makeRequest("POST", "/auth/register", firstUserRequest, "")
				suite.NoError(err)
				suite.Equal(http.StatusCreated, w.Code)
			}

			w, err := suite.makeRequest("POST", "/auth/register", tt.requestBody, "")
			suite.NoError(err)
			suite.Equal(tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			suite.NoError(err)

			if tt.expectError {
				suite.Contains(response, "error")
			} else {
				suite.Contains(response, "token")
				suite.Contains(response, "user")

				user := response["user"].(map[string]interface{})
				suite.Equal(tt.requestBody.Username, user["username"])
				suite.Equal(tt.requestBody.Email, user["email"])
			}
		})
	}
}

// Test 2: Login with valid credentials
func (suite *AuthTestSuite) TestLoginWithValidCredentials() {
	// Create a test user first
	testUser := suite.createTestUser("testuser", "test@example.com", "password123")

	loginRequest := services.LoginRequest{
		Email:    testUser.Email,
		Password: "password123",
	}

	w, err := suite.makeRequest("POST", "/auth/login", loginRequest, "")
	suite.NoError(err)
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.NoError(err)

	// Check response structure
	suite.Contains(response, "token")
	suite.Contains(response, "user")

	// Verify user data
	user := response["user"].(map[string]interface{})
	suite.Equal(testUser.Username, user["username"])
	suite.Equal(testUser.Email, user["email"])
	suite.NotContains(user, "password_hash")

	// Verify token is not empty
	token := response["token"].(string)
	suite.NotEmpty(token)

	// Verify token can be validated
	claims, err := suite.authService.ValidateToken(token)
	suite.NoError(err)
	suite.Equal(testUser.ID, claims.UserID)
	suite.Equal(testUser.Email, claims.Email)
}

// Test 3: Login with invalid email
func (suite *AuthTestSuite) TestLoginWithInvalidEmail() {
	tests := []struct {
		name        string
		email       string
		password    string
		description string
	}{
		{
			name:        "nonexistent_email",
			email:       "nonexistent@example.com",
			password:    "password123",
			description: "Email that doesn't exist in database",
		},
		{
			name:        "malformed_email",
			email:       "invalid-email-format",
			password:    "password123",
			description: "Malformed email address",
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			loginRequest := services.LoginRequest{
				Email:    tt.email,
				Password: tt.password,
			}

			w, err := suite.makeRequest("POST", "/auth/login", loginRequest, "")
			suite.NoError(err)

			// All invalid email scenarios should return either 400 or 401
			suite.True(w.Code == http.StatusBadRequest || w.Code == http.StatusUnauthorized)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			suite.NoError(err)

			suite.Contains(response, "error")
			suite.NotContains(response, "token")
			suite.NotContains(response, "user")
		})
	}
}

// Test 4: Login with invalid password
func (suite *AuthTestSuite) TestLoginWithInvalidPassword() {
	// Create a test user first
	testUser := suite.createTestUser("testuser", "test@example.com", "correctpassword123")

	tests := []struct {
		name        string
		password    string
		description string
	}{
		{
			name:        "wrong_password",
			password:    "wrongpassword123",
			description: "Incorrect password for existing user",
		},
	}

	for _, tt := range tests {
		suite.Run(tt.name, func() {
			loginRequest := services.LoginRequest{
				Email:    testUser.Email,
				Password: tt.password,
			}

			w, err := suite.makeRequest("POST", "/auth/login", loginRequest, "")
			suite.NoError(err)

			// Invalid password should return 400 or 401
			suite.True(w.Code == http.StatusBadRequest || w.Code == http.StatusUnauthorized)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			suite.NoError(err)

			suite.Contains(response, "error")
			suite.NotContains(response, "token")
			suite.NotContains(response, "user")
		})
	}
}

// Additional test: Protected route access with valid token
func (suite *AuthTestSuite) TestProtectedRouteWithValidToken() {
	// Create and login user
	testUser := suite.createTestUser("testuser", "test@example.com", "password123")
	token := suite.loginTestUser(testUser.Email, "password123")

	// Test accessing protected route
	w, err := suite.makeRequest("GET", "/auth/me", nil, token)
	suite.NoError(err)
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	suite.NoError(err)

	suite.Equal(float64(testUser.ID), response["id"])
	suite.Equal(testUser.Username, response["username"])
	suite.Equal(testUser.Email, response["email"])
}

// Additional test: Protected route access without token
func (suite *AuthTestSuite) TestProtectedRouteWithoutToken() {
	w, err := suite.makeRequest("GET", "/auth/me", nil, "")
	suite.NoError(err)
	suite.Equal(http.StatusUnauthorized, w.Code)
}

// Additional test: Protected route access with invalid token
func (suite *AuthTestSuite) TestProtectedRouteWithInvalidToken() {
	w, err := suite.makeRequest("GET", "/auth/me", nil, "invalid-token")
	suite.NoError(err)
	suite.Equal(http.StatusUnauthorized, w.Code)
}
