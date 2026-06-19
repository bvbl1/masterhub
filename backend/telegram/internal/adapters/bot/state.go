package bot

import (
	"encoding/json"
	"log"
	"os"
	"sync"

	"github.com/Rask1lll/masterhub/backend/telegram/internal/application/core/domain"
)

type persistedSession struct {
	UserID int64  `json:"user_id"`
	Role   string `json:"role"`
	Token  string `json:"token"`
}

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[int64]*domain.UserSession
	filePath string
}

func NewSessionStore() *SessionStore {
	s := &SessionStore{
		sessions: make(map[int64]*domain.UserSession),
		filePath: "/data/sessions.json",
	}
	s.load()
	return s
}

func (s *SessionStore) Get(chatID int64) *domain.UserSession {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.sessions[chatID]
}

func (s *SessionStore) GetOrCreate(chatID int64) *domain.UserSession {
	s.mu.Lock()
	defer s.mu.Unlock()

	if sess, ok := s.sessions[chatID]; ok {
		return sess
	}

	sess := &domain.UserSession{
		ChatID: chatID,
		State:  domain.StateIdle,
	}

	s.sessions[chatID] = sess
	return sess
}

func (s *SessionStore) Set(sess *domain.UserSession) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.sessions[sess.ChatID] = sess
	s.save()
}

func (s *SessionStore) Reset(chatID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if sess, ok := s.sessions[chatID]; ok {
		sess.State = domain.StateIdle
		sess.City = ""
		sess.ServiceType = ""
		sess.Description = ""
		sess.BudgetMin = 0
		sess.BudgetMax = 0
		sess.ScheduledAt = ""
		sess.PhotoFileID = ""
		sess.MissingField = ""
	}

	s.save()
}

func (s *SessionStore) save() {
	data := make(map[int64]persistedSession)

	for chatID, sess := range s.sessions {
		if sess.UserID != 0 {
			data[chatID] = persistedSession{
				UserID: sess.UserID,
				Role:   sess.Role,
				Token:  sess.Token,
			}
		}
	}

	_ = os.MkdirAll("/data", 0755)

	b, err := json.Marshal(data)
	if err != nil {
		log.Printf("session save error: %v", err)
		return
	}

	if err := os.WriteFile(s.filePath, b, 0644); err != nil {
		log.Printf("session write error: %v", err)
	}
}

func (s *SessionStore) load() {
	b, err := os.ReadFile(s.filePath)
	if err != nil {
		return
	}

	var data map[int64]persistedSession
	if err := json.Unmarshal(b, &data); err != nil {
		log.Printf("session load error: %v", err)
		return
	}

	for chatID, ps := range data {
		s.sessions[chatID] = &domain.UserSession{
			ChatID: chatID,
			UserID: ps.UserID,
			Role:   ps.Role,
			Token:  ps.Token,
			State:  domain.StateIdle,
		}
	}

	log.Printf("Loaded %d sessions from disk", len(data))
}
