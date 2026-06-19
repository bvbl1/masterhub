package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Sender struct {
	apiKey   string
	from     string
	renderer *TemplateRenderer
	client   *http.Client
}

func NewSender(apiKey, from string) (*Sender, error) {
	renderer, err := NewTemplateRenderer()
	if err != nil {
		return nil, err
	}

	return &Sender{
		apiKey:   apiKey,
		from:     from,
		renderer: renderer,
		client:   &http.Client{},
	}, nil
}

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Text    string   `json:"text,omitempty"`
	HTML    string   `json:"html,omitempty"`
}

func (s *Sender) send(to, subject, text, html string) error {
	payload := resendPayload{
		From:    s.from,
		To:      []string{to},
		Subject: subject,
		Text:    text,
		HTML:    html,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend API error %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (s *Sender) Send(to, subject, body string) error {
	return s.send(to, subject, body, "")
}

func (s *Sender) SendHTML(to, notificationType string, data TemplateData) error {
	title, ok := data["Title"].(string)
	if !ok {
		title = "Notification"
	}

	body, ok := data["Body"].(string)
	if !ok {
		body = ""
	}

	// Render beautiful HTML
	htmlBody := s.renderer.RenderEmail(title, body)

	// Get nice subject line
	subject := GetSubjectForType(notificationType)

	return s.send(to, subject, body, htmlBody)
}
