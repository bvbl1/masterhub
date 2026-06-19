package bot

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

	grpcclient "github.com/Rask1lll/masterhub/backend/telegram/internal/adapters/grpc"
	"github.com/Rask1lll/masterhub/backend/telegram/internal/application/core/domain"
	jobrequestpb "github.com/bvbl1/masterhub-proto/golang/job-request"
	userpb "github.com/bvbl1/masterhub-proto/golang/user"
)

var cities = []string{
	"Астана", "Алматы", "Шымкент",
	"Атырау", "Актобе", "Тараз",
}

var serviceTypes = []string{
	"Электромонтаж", "Сантехника",
	"Плитка", "Покраска",
	"Штукатурка", "Ремонт под ключ",
	"Натяжные потолки", "Другое",
}

type Handler struct {
	bot         *tgbotapi.BotAPI
	sessions    *SessionStore
	clients     *grpcclient.Clients
	frontendURL string
	ai          *AIHelper
}

func NewHandler(
	bot *tgbotapi.BotAPI,
	sessions *SessionStore,
	clients *grpcclient.Clients,
	frontendURL string,
	ai *AIHelper,
) *Handler {
	return &Handler{
		bot:         bot,
		sessions:    sessions,
		clients:     clients,
		frontendURL: frontendURL,
		ai:          ai,
	}
}

func (h *Handler) HandleStart(chatID int64, args string) {
	sess := h.sessions.GetOrCreate(chatID)
	if args != "" {
		h.handleLinkToken(chatID, sess, args)
		return
	}
	msg := tgbotapi.NewMessage(chatID, `👋 <b>Добро пожаловать в MasterHub!</b>

Я помогу вам:
- Создать заявку на ремонт
- Найти мастеров в вашем городе
- Получать уведомления о статусе заявок

Выберите действие:`)
	msg.ParseMode = "HTML"
	msg.ReplyMarkup = mainMenuKeyboard()
	h.bot.Send(msg)
}

func (h *Handler) HandleHelp(chatID int64) {
	h.sendHTML(chatID, `<b>🔧 Команды бота:</b>

/start — Главное меню
/neworder — Создать новую заявку
/myorders — Мои заявки
/help — Помощь

<b>🤖 AI-помощник:</b>
Напишите мне свободным текстом — я всё пойму и сформирую заявку!

Например: <i>"Алмыта, сантехника, двести тысяч, в июне"</i>
Или: <i>"нужна электрика в астане бюджет 300к через неделю"</i>`)
}

func (h *Handler) HandleNewOrder(chatID int64) {
	sess := h.sessions.GetOrCreate(chatID)
	if sess.UserID == 0 {
		h.sendHTML(chatID, fmt.Sprintf(
			"🔐 Сначала привяжите Telegram к аккаунту:\n%s/profile",
			h.frontendURL,
		))
		return
	}

	h.sessions.Reset(chatID)
	sess = h.sessions.GetOrCreate(chatID)

	h.sendHTML(chatID, `🤖 <b>Опишите заявку обычным текстом</b>

Например:
<i>Атана нужна сантехника бюджет семсот тысяч на этой неделе</i>

Я сам исправлю ошибки, пойму город, услугу, бюджет и дату.`)
}

func (h *Handler) HandleMyOrders(chatID int64) {
	sess := h.sessions.GetOrCreate(chatID)

	if sess.UserID == 0 {
		h.sendHTML(chatID, fmt.Sprintf(
			"🔐 Привяжите Telegram к аккаунту:\n%s/profile",
			h.frontendURL,
		))
		return
	}

	ctx, err := grpcAuthContext(sess)
	if err != nil {
		h.sendHTML(chatID, fmt.Sprintf(
			"🔐 Привяжите Telegram к аккаунту:\n%s/profile",
			h.frontendURL,
		))
		return
	}

	resp, err := h.clients.JobRequest.ListJobRequests(ctx, &jobrequestpb.ListJobRequestsRequest{
		Limit:  10,
		Offset: 0,
	})
	if err != nil {
		log.Printf("ListJobRequests error: %v", err)
		h.sendHTML(chatID, "❌ Не удалось загрузить ваши заявки.")
		return
	}

	if len(resp.JobRequests) == 0 {
		h.sendHTML(chatID, "📭 У вас пока нет заявок.")
		return
	}

	text := "📋 <b>Ваши заявки:</b>\n\n"

	for _, order := range resp.JobRequests {
		text += fmt.Sprintf(
			"🆔 <b>#%d</b>\n📍 %s\n🔧 %s\n💰 %.0f - %.0f тг\n📌 Статус: %s\n\n",
			order.Id,
			order.City,
			order.Title,
			order.BudgetMin,
			order.BudgetMax,
			order.Status,
		)
	}

	text += fmt.Sprintf("🔗 Подробнее: %s/requests", h.frontendURL)

	h.sendHTML(chatID, text)
}

func (h *Handler) handleLinkToken(chatID int64, sess *domain.UserSession, token string) {
	ctx := context.Background()
	resp, err := h.clients.User.LinkTelegramByToken(ctx, &userpb.LinkTelegramRequest{
		Token:  token,
		ChatId: chatID,
	})
	if err != nil {
		h.sendHTML(chatID, "❌ Ссылка недействительна или устарела.\nПопробуйте снова в личном кабинете.")
		return
	}

	log.Printf("handleLinkToken: userID=%d role=%s token=%s", resp.UserId, resp.Role, resp.Token)
	sess.UserID = resp.UserId
	sess.Role = resp.Role
	sess.Token = resp.Token
	h.sessions.Set(sess)
	log.Printf("Session saved: userID=%d", sess.UserID)

	h.sendHTML(chatID, fmt.Sprintf(
		"✅ <b>Telegram успешно привязан!</b>\n\nДобро пожаловать, <b>%s</b>! Теперь вы будете получать уведомления здесь.",
		resp.FirstName,
	))
	msg := tgbotapi.NewMessage(chatID, "Выберите действие:")
	msg.ReplyMarkup = mainMenuKeyboard()
	h.bot.Send(msg)
}

func (h *Handler) HandleMessage(chatID int64, text string, photoFileID string) {
	sess := h.sessions.GetOrCreate(chatID)

	if sess.UserID == 0 {
		h.sendHTML(chatID, fmt.Sprintf(
			"🔐 Сначала привяжите Telegram к аккаунту:\n%s/profile",
			h.frontendURL,
		))
		return
	}

	if sess.State == domain.StateConfirm {
		h.handleConfirm(chatID, sess, text)
		return
	}

	if h.ai == nil {
		h.sendHTML(chatID, "AI сейчас отключён. Проверьте GEMINI_API_KEY и AI_ENABLED.")
		return
	}

	h.handleFreeTextAI(chatID, sess, text, photoFileID)
}

func (h *Handler) showConfirmation(chatID int64, sess *domain.UserSession) {
	budgetDisplay := "не указан"
	if sess.BudgetMin > 0 || sess.BudgetMax > 0 {
		budgetDisplay = fmt.Sprintf("%.0f - %.0f тг", sess.BudgetMin, sess.BudgetMax)
	}

	scheduledDisplay := sess.ScheduledAt
	if t, err := time.Parse(time.RFC3339, sess.ScheduledAt); err == nil {
		scheduledDisplay = t.Format("02.01.2006")
	}

	text := fmt.Sprintf(`✅ <b>Проверьте заявку:</b>

📍 <b>Город:</b> %s
🔧 <b>Услуга:</b> %s
📝 <b>Описание:</b> %s
💰 <b>Бюджет:</b> %s
📅 <b>Дата:</b> %s

Всё верно?`,
		sess.City,
		sess.ServiceType,
		sess.Description,
		budgetDisplay,
		scheduledDisplay,
	)

	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "HTML"
	msg.ReplyMarkup = confirmKeyboard()
	h.bot.Send(msg)
}

func (h *Handler) handleConfirm(chatID int64, sess *domain.UserSession, text string) {
	sess = h.sessions.GetOrCreate(chatID)

	switch text {
	case "✅ Отправить":
		h.submitOrder(chatID, sess)
	case "❌ Отмена":
		h.sessions.Reset(chatID)
		msg := tgbotapi.NewMessage(chatID, "Заявка отменена.")
		msg.ReplyMarkup = mainMenuKeyboard()
		h.bot.Send(msg)
	}
}

func (h *Handler) submitOrder(chatID int64, sess *domain.UserSession) {
	sess = h.sessions.GetOrCreate(chatID)
	if sess.UserID == 0 || strings.TrimSpace(sess.Token) == "" {
		h.sendHTML(chatID, fmt.Sprintf(
			"🔐 Сначала привяжите Telegram к аккаунту на сайте:\n%s/profile",
			h.frontendURL,
		))
		return
	}
	if sess.Role != "" && sess.Role != "customer" {
		h.sendHTML(chatID, "❌ Создавать заявки могут только заказчики (роль <b>customer</b>).")
		return
	}

	log.Printf(
		"submitOrder: userID=%d city=%s service=%s budgetMin=%.0f budgetMax=%.0f scheduledAt=%s",
		sess.UserID,
		sess.City,
		sess.ServiceType,
		sess.BudgetMin,
		sess.BudgetMax,
		sess.ScheduledAt,
	)

	if sess.BudgetMax == 0 {
		sess.BudgetMax = sess.BudgetMin
	}
	if sess.BudgetMax == 0 {
		sess.BudgetMax = 1
	}
	if sess.ScheduledAt == "" {
		sess.ScheduledAt = time.Now().AddDate(0, 0, 7).Format(time.RFC3339)
	}

	ctxWithMeta, err := grpcAuthContext(sess)
	if err != nil {
		h.sendHTML(chatID, fmt.Sprintf(
			"🔐 Сначала привяжите Telegram к аккаунту на сайте:\n%s/profile",
			h.frontendURL,
		))
		return
	}

	if _, err := h.clients.User.GetMe(ctxWithMeta, &userpb.GetMeRequest{}); err != nil {
		log.Printf("GetMe before CreateJobRequest: %v", err)
		if isUnauthenticated(err) {
			h.sendHTML(chatID, "🔐 Сессия истекла. Снова нажмите «Привязать Telegram» в профиле на сайте.")
			return
		}
		h.sendHTML(chatID, fmt.Sprintf("❌ Не удалось проверить аккаунт: %s", grpcErrorMessage(err)))
		return
	}

	resp, err := h.clients.JobRequest.CreateJobRequest(ctxWithMeta, &jobrequestpb.CreateJobRequestRequest{
		CategoryId:  1,
		Title:       sess.ServiceType,
		Description: sess.Description,
		City:        sess.City,
		BudgetMin:   sess.BudgetMin,
		BudgetMax:   sess.BudgetMax,
		ScheduledAt: sess.ScheduledAt,
	})

	if err != nil {
		log.Printf("CreateJobRequest error: %v", err)
		if isUnauthenticated(err) {
			h.sendHTML(chatID, "🔐 Сессия истекла. Снова нажмите «Привязать Telegram» в профиле на сайте.")
			return
		}
		h.sendHTML(chatID, fmt.Sprintf(
			"❌ Не удалось создать заявку: %s\n\nЕсли ошибка повторяется — проверьте, что запущен <code>job-request-service</code> и одинаковый <code>JWT_SECRET</code> в user-service и job-request.",
			grpcErrorMessage(err),
		))
		return
	}

	msg := tgbotapi.NewMessage(chatID, fmt.Sprintf(
		"🎉 <b>Заявка #%d успешно создана!</b>\n\n📍 %s — %s\n💰 %.0f - %.0f тг\n\nСмотреть на сайте: %s/requests/%d",
		resp.JobRequest.Id,
		sess.City,
		sess.ServiceType,
		sess.BudgetMin,
		sess.BudgetMax,
		h.frontendURL,
		resp.JobRequest.Id,
	))
	msg.ParseMode = "HTML"
	msg.ReplyMarkup = mainMenuKeyboard()
	h.bot.Send(msg)
	h.sessions.Reset(chatID)
}

func (h *Handler) handleFreeTextAI(chatID int64, sess *domain.UserSession, text string, photoFileID string) {
	current := &ParsedOrder{
		City:        sess.City,
		ServiceType: sess.ServiceType,
		Description: sess.Description,
		BudgetMin:   sess.BudgetMin,
		BudgetMax:   sess.BudgetMax,
		ScheduledAt: sess.ScheduledAt,
	}

	parsed, err := h.ai.ParseOrderFromText(text, current)
	if err != nil {
		log.Printf("AI parse error: %v", err)
		h.sendHTML(chatID, "😔 Не смог разобрать сообщение. Попробуйте написать проще: город, услуга, бюджет и дата.")
		return
	}

	sess.City = parsed.City
	sess.ServiceType = parsed.ServiceType
	sess.Description = parsed.Description
	sess.BudgetMin = parsed.BudgetMin
	sess.BudgetMax = parsed.BudgetMax
	sess.ScheduledAt = parsed.ScheduledAt

	if photoFileID != "" {
		sess.PhotoFileID = photoFileID
	}

	if len(parsed.Missing) > 0 {
		sess.State = domain.StateWaitMissing
		sess.MissingField = parsed.Missing[0]
		h.sessions.Set(sess)

		h.askMissingField(chatID, parsed.Missing[0])
		return
	}

	sess.State = domain.StateConfirm
	sess.MissingField = ""
	h.sessions.Set(sess)

	h.showConfirmation(chatID, sess)
}

func (h *Handler) HandleCallback(chatID int64, messageID int, data string) {
	parts := strings.SplitN(data, ":", 2)
	if len(parts) != 2 {
		return
	}
	action, id := parts[0], parts[1]
	switch action {
	case "apply":
		h.sendHTML(chatID, fmt.Sprintf("✅ Ваш отклик на заявку #%s отправлен!", id))
		edit := tgbotapi.NewEditMessageReplyMarkup(chatID, messageID, tgbotapi.InlineKeyboardMarkup{})
		h.bot.Send(edit)
	case "view":
		h.sendHTML(chatID, fmt.Sprintf("Подробнее: %s/requests/%s", h.frontendURL, id))
	}
}

func (h *Handler) SendProviderNotification(chatID int64, orderID int64, city, serviceType, description, budget string) {
	text := fmt.Sprintf("🔔 <b>Новая заявка!</b>\n\n📍 %s — %s\n📝 %s\n💰 %s", city, serviceType, description, budget)
	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "HTML"
	msg.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonData("✅ Откликнуться", fmt.Sprintf("apply:%d", orderID)),
			tgbotapi.NewInlineKeyboardButtonData("👁 Подробнее", fmt.Sprintf("view:%d", orderID)),
		),
	)
	h.bot.Send(msg)
}

func mainMenuKeyboard() tgbotapi.ReplyKeyboardMarkup {
	kb := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("📋 Создать заявку"),
			tgbotapi.NewKeyboardButton("📂 Мои заявки"),
		),
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("❓ Помощь"),
		),
	)
	kb.ResizeKeyboard = true
	return kb
}

func cityKeyboard() tgbotapi.ReplyKeyboardMarkup {
	rows := [][]tgbotapi.KeyboardButton{}
	for i := 0; i < len(cities); i += 2 {
		row := []tgbotapi.KeyboardButton{tgbotapi.NewKeyboardButton(cities[i])}
		if i+1 < len(cities) {
			row = append(row, tgbotapi.NewKeyboardButton(cities[i+1]))
		}
		rows = append(rows, row)
	}
	kb := tgbotapi.NewReplyKeyboard(rows...)
	kb.ResizeKeyboard = true
	return kb
}

func serviceKeyboard() tgbotapi.ReplyKeyboardMarkup {
	rows := [][]tgbotapi.KeyboardButton{}
	for i := 0; i < len(serviceTypes); i += 2 {
		row := []tgbotapi.KeyboardButton{tgbotapi.NewKeyboardButton(serviceTypes[i])}
		if i+1 < len(serviceTypes) {
			row = append(row, tgbotapi.NewKeyboardButton(serviceTypes[i+1]))
		}
		rows = append(rows, row)
	}
	kb := tgbotapi.NewReplyKeyboard(rows...)
	kb.ResizeKeyboard = true
	return kb
}

func skipKeyboard() tgbotapi.ReplyKeyboardMarkup {
	kb := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("Пропустить"),
		),
	)
	kb.ResizeKeyboard = true
	return kb
}

func confirmKeyboard() tgbotapi.ReplyKeyboardMarkup {
	kb := tgbotapi.NewReplyKeyboard(
		tgbotapi.NewKeyboardButtonRow(
			tgbotapi.NewKeyboardButton("✅ Отправить"),
			tgbotapi.NewKeyboardButton("❌ Отмена"),
		),
	)
	kb.ResizeKeyboard = true
	return kb
}

func (h *Handler) sendHTML(chatID int64, text string) {
	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "HTML"
	h.bot.Send(msg)
}

func (h *Handler) askMissingField(chatID int64, field string) {
	switch field {
	case "city":
		h.sendHTML(chatID, "📍 В каком городе нужен мастер? Например: Астана, Алматы, Шымкент.")
	case "service_type":
		h.sendHTML(chatID, "🔧 Какая услуга нужна? Например: электрика, сантехника, плитка, ремонт под ключ.")
	case "description":
		h.sendHTML(chatID, "📝 Опишите задачу подробнее.")
	case "budget":
		h.sendHTML(chatID, "💰 Какой примерный бюджет? Например: 300к, семьсот тысяч, до миллиона.")
	case "scheduled_at":
		h.sendHTML(chatID, "📅 Когда нужно начать? Например: сегодня, завтра, 20 мая, на этой неделе.")
	default:
		h.sendHTML(chatID, "Уточните, пожалуйста, недостающую информацию.")
	}
}
