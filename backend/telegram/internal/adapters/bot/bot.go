package bot

import (
	"log"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

	"github.com/Rask1lll/masterhub/backend/telegram/config"
	grpcclient "github.com/Rask1lll/masterhub/backend/telegram/internal/adapters/grpc"
)

type Bot struct {
	api     *tgbotapi.BotAPI
	handler *Handler
}

func New(cfg *config.Config, clients *grpcclient.Clients) (*Bot, error) {
	api, err := tgbotapi.NewBotAPI(cfg.TelegramBotToken)
	if err != nil {
		return nil, err
	}

	sessions := NewSessionStore()

	var ai *AIHelper
	if cfg.AIEnabled && cfg.GeminiAPIKey != "" {
		ai = NewAIHelper(cfg.GeminiAPIKey)
		log.Println("AI helper enabled")
	} else {
		log.Println("AI helper disabled")
	}

	handler := NewHandler(api, sessions, clients, cfg.FrontendBaseURL, ai)

	log.Printf("Бот @%s запущен", api.Self.UserName)

	return &Bot{
		api:     api,
		handler: handler,
	}, nil
}

func (b *Bot) Run() {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := b.api.GetUpdatesChan(u)

	for update := range updates {
		if update.CallbackQuery != nil {
			b.handler.HandleCallback(
				update.CallbackQuery.Message.Chat.ID,
				update.CallbackQuery.Message.MessageID,
				update.CallbackQuery.Data,
			)

			ack := tgbotapi.NewCallback(update.CallbackQuery.ID, "")
			_, _ = b.api.Request(ack)
			continue
		}

		if update.Message == nil {
			continue
		}

		chatID := update.Message.Chat.ID
		text := update.Message.Text

		photoFileID := ""
		if len(update.Message.Photo) > 0 {
			photos := update.Message.Photo
			photoFileID = photos[len(photos)-1].FileID
		}

		if update.Message.IsCommand() {
			switch update.Message.Command() {
			case "start":
				b.handler.HandleStart(chatID, update.Message.CommandArguments())
			case "neworder":
				b.handler.HandleNewOrder(chatID)
			case "myorders":
				b.handler.HandleMyOrders(chatID)
			case "help":
				b.handler.HandleHelp(chatID)
			}
			continue
		}

		switch text {
		case "📋 Создать заявку":
			b.handler.HandleNewOrder(chatID)
		case "📂 Мои заявки":
			b.handler.HandleMyOrders(chatID)
		case "❓ Помощь":
			b.handler.HandleHelp(chatID)
		default:
			b.handler.HandleMessage(chatID, text, photoFileID)
		}
	}
}
