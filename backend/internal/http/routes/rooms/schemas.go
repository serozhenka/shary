package rooms

type CreateRoomRequest struct {
	Name string `json:"name" binding:"required"`
}

type UpdateRoomRequest struct {
	Name string `json:"name" binding:"required"`
}

type AddUserToRoomRequest struct {
	Email string `json:"email" binding:"required,email"`
}
