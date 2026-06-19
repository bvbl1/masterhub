package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/chat/internal/ports"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

// registry keeps track of all active WebSocket connections
type registry struct {
	mu    sync.RWMutex
	conns map[int64]*websocket.Conn // user_id -> connection
}

func newRegistry() *registry {
	return &registry{
		conns: make(map[int64]*websocket.Conn),
	}
}

func (r *registry) add(userID int64, conn *websocket.Conn) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.conns[userID] = conn
}

func (r *registry) remove(userID int64) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.conns, userID)
}

func (r *registry) get(userID int64) (*websocket.Conn, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	conn, ok := r.conns[userID]
	return conn, ok
}

// Handler is the WebSocket adapter
type Handler struct {
	api      ports.APIPort
	registry *registry
	upgrader websocket.Upgrader
	secret   string
}

func NewHandler(api ports.APIPort, secret string) *Handler {
	return &Handler{
		api:      api,
		registry: newRegistry(),
		secret:   secret,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // allow all origins for now
			},
		},
	}
}

// ServeWS handles incoming WebSocket connections
// frontend connects to: ws://localhost:8081/ws?token=<JWT>
func (h *Handler) ServeWS(w http.ResponseWriter, r *http.Request) {
	// 1. validate JWT from query param
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	userID, err := h.parseToken(tokenStr)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	// 2. upgrade HTTP to WebSocket
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// 3. register connection
	h.registry.add(userID, conn)
	defer h.registry.remove(userID)

	log.Printf("User %d connected via WebSocket", userID)

	// 4. read loop
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			log.Printf("User %d disconnected: %v", userID, err)
			break
		}

		var incoming domain.IncomingMessage
		if err := json.Unmarshal(raw, &incoming); err != nil {
			h.sendError(conn, "invalid message format")
			continue
		}

		switch incoming.Type {
		case "send_message":
			h.handleSendMessage(conn, userID, incoming)
		default:
			h.sendError(conn, "unknown message type")
		}
	}
}

func (h *Handler) handleSendMessage(conn *websocket.Conn, senderID int64, incoming domain.IncomingMessage) {
	if incoming.ConversationID == 0 {
		h.sendError(conn, "conversation_id is required")
		return
	}
	if incoming.RecipientID == 0 {
		h.sendError(conn, "recipient_id is required")
		return
	}
	if incoming.Content == "" {
		h.sendError(conn, "content is required")
		return
	}
	if incoming.Content == "" && incoming.MediaURL == nil {
		h.sendError(conn, "content or media_url is required")
		return
	}
	// save to DB
	msg, err := h.api.SendMessage(context.Background(), domain.Message{
		ConversationID: incoming.ConversationID,
		SenderID:       senderID,
		Content:        incoming.Content,
		MediaURL:       incoming.MediaURL,
	})
	if err != nil {
		h.sendError(conn, "failed to send message")
		log.Printf("SendMessage error: %v", err)
		return
	}

	// confirm back to sender
	h.sendJSON(conn, domain.OutgoingMessage{
		Type:    "message_sent",
		Message: msg,
	})

	// push to recipient if online
	if recipientConn, ok := h.registry.get(incoming.RecipientID); ok {
		h.sendJSON(recipientConn, domain.OutgoingMessage{
			Type:    "new_message",
			Message: msg,
		})
	}
	// if recipient is offline, message is already saved in DB
	// they will fetch it via GetMessages when they come online
}

// helper to send JSON over WebSocket
func (h *Handler) sendJSON(conn *websocket.Conn, msg interface{}) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("marshal error: %v", err)
		return
	}
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("write error: %v", err)
	}
}

func (h *Handler) sendError(conn *websocket.Conn, errMsg string) {
	h.sendJSON(conn, domain.OutgoingMessage{
		Type:  "error",
		Error: errMsg,
	})
}

func (h *Handler) parseToken(tokenStr string) (int64, error) {
	claims := &domain.Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(h.secret), nil
	})
	if err != nil || !token.Valid {
		return 0, err
	}
	return claims.UserID, nil
}
