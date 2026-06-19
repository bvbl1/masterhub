package domain

type BotState int

const (
	StateIdle BotState = iota
	StateWaitMissing
	StateConfirm
)

type UserSession struct {
	ChatID int64
	UserID int64
	State  BotState
	Role   string
	Token  string

	City        string
	ServiceType string
	Description string
	BudgetMin   float64
	BudgetMax   float64
	ScheduledAt string
	PhotoFileID string

	MissingField string
}
