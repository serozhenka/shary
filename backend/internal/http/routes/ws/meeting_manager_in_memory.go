package ws

type MeetingManager interface {
	GetMeeting(id string) *Meeting
	CreateMeeting(id string) *Meeting
	DeleteMeeting(id string)
}
