package ws

import "sync"

type inMemoryMeetingManager struct {
	rooms map[string]*Meeting
	mu    sync.RWMutex
}

func NewInMemoryMeetingManager() MeetingManager {
	return &inMemoryMeetingManager{
		rooms: make(map[string]*Meeting),
	}
}

func (m *inMemoryMeetingManager) GetMeeting(id string) *Meeting {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.rooms[id]
}

func (m *inMemoryMeetingManager) CreateMeeting(id string) *Meeting {
	m.mu.Lock()
	defer m.mu.Unlock()
	meeting := NewMeeting()
	m.rooms[id] = meeting
	return meeting
}

func (m *inMemoryMeetingManager) DeleteMeeting(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.rooms, id)
}
