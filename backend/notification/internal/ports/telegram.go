package ports

type TelegramPort interface {
	Send(chatID int64, text string) error
}
