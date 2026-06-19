package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Sender struct {
	botToken string
	baseURL  string
	client   *http.Client
}

type sendMessageRequest struct {
	ChatID    int64  `json:"chat_id"`
	Text      string `json:"text"`
	ParseMode string `json:"parse_mode"`
}

func NewSender(botToken string) *Sender {
	return &Sender{
		botToken: botToken,
		baseURL:  fmt.Sprintf("https://api.telegram.org/bot%s", botToken),
		client:   &http.Client{},
	}
}

func (s *Sender) Send(chatID int64, text string) error {
	payload := sendMessageRequest{
		ChatID:    chatID,
		Text:      text,
		ParseMode: "HTML",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal telegram request: %w", err)
	}

	url := fmt.Sprintf("%s/sendMessage", s.baseURL)
	resp, err := s.client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("send telegram message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API returned status %d", resp.StatusCode)
	}

	return nil
}
