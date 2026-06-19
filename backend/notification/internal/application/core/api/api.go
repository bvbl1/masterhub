package api

import (
	"context"
	"fmt"
	"log"

	"github.com/Rask1lll/masterhub/backend/notification/internal/adapters/email"
	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/notification/internal/ports"
)

type Application struct {
	db       ports.DBPort
	email    ports.EmailPort
	telegram ports.TelegramPort
}

func NewApplication(db ports.DBPort, email ports.EmailPort, telegram ports.TelegramPort) *Application {
	return &Application{db: db, email: email, telegram: telegram}
}

func (a *Application) SendNotification(ctx context.Context, n domain.Notification, emailAddr string) (domain.Notification, error) {
	n.IsRead = false
	// 1. save to DB
	saved, err := a.db.Create(ctx, n)
	if err != nil {
		return domain.Notification{}, fmt.Errorf("create notification: %w", err)
	}

	// 2. send beautiful HTML email asynchronously
	go func() {
		if emailAddr == "" {
			return
		}
		templateData := email.TemplateData{
			"Title": n.Title,
			"Body":  n.Body,
		}
		if err := a.email.SendHTML(emailAddr, n.Type, templateData); err != nil {
			log.Printf("failed to send email to %s: %v", emailAddr, err)
		}
	}()

	return saved, nil
}

func (a *Application) ListNotifications(ctx context.Context) ([]domain.Notification, error) {
	userID, ok := ctx.Value("user_id").(int64)
	if !ok {
		return nil, fmt.Errorf("user_id not found in context")
	}

	return a.db.ListByUserID(ctx, userID)
}

func (a *Application) MarkNotificationRead(ctx context.Context, id int64) error {
	return a.db.MarkRead(ctx, id)
}

func (a *Application) SendTelegramMessage(ctx context.Context, chatID int64, text string) error {
	if chatID == 0 {
		return nil // пользователь не привязал Telegram — молча пропускаем
	}
	if err := a.telegram.Send(chatID, text); err != nil {
		return fmt.Errorf("telegram send: %w", err)
	}
	return nil
}
