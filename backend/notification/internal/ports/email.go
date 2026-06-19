package ports

import "github.com/Rask1lll/masterhub/backend/notification/internal/adapters/email"

type EmailPort interface {
	Send(to, subject, body string) error
	SendHTML(to, notificationType string, data email.TemplateData) error
}
