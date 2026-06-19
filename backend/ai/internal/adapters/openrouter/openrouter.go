package openrouter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/Rask1lll/masterhub/backend/ai/internal/application/core/domain"
)

type Client struct {
	apiKey string
	model  string
	client *http.Client
}

func New(apiKey string, model string) *Client {
	if model == "" {
		model = "openrouter/free"
	}

	return &Client{
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

func (c *Client) Chat(ctx context.Context, req domain.AIChatRequest) (*domain.AIChatResponse, error) {
	prompt := buildPrompt(req)

	raw, err := c.callOpenRouter(ctx, prompt, 700)
	if err != nil {
		return nil, err
	}

	var response domain.AIChatResponse
	if err := json.Unmarshal([]byte(raw), &response); err != nil {
		return nil, fmt.Errorf("parse openrouter json: %w, raw: %s", err, raw)
	}

	normalizeResponse(&response)

	return &response, nil
}

func (c *Client) callOpenRouter(ctx context.Context, prompt string, maxTokens int) (string, error) {
	payload := map[string]interface{}{
		"model": c.model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "Ты AI-помощник MasterHub. Всегда возвращай только валидный JSON без markdown.",
			},
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": 0.2,
		"max_tokens":  maxTokens,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	request, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		"https://openrouter.ai/api/v1/chat/completions",
		bytes.NewReader(body),
	)
	if err != nil {
		return "", err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+c.apiKey)
	request.Header.Set("HTTP-Referer", "http://localhost:3000")
	request.Header.Set("X-Title", "MasterHub AI")

	resp, err := c.client.Do(request)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("openrouter status %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("decode openrouter response: %w, body: %s", err, string(respBody))
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("empty openrouter response: %s", string(respBody))
	}

	text := strings.TrimSpace(result.Choices[0].Message.Content)

	log.Printf("[ai/openrouter] raw response: %s", text)

	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	return text, nil
}

func buildPrompt(req domain.AIChatRequest) string {
	now := time.Now()

	contextJSON := "{}"
	if req.Context != nil {
		if b, err := json.Marshal(req.Context); err == nil {
			contextJSON = string(b)
		}
	}

	return fmt.Sprintf(`
Ты — AI-помощник платформы MasterHub в Казахстане.

Сегодня: %s.
Текущий контекст: %s

Сообщение пользователя:
%s

Верни ТОЛЬКО JSON:
{
  "message": "",
  "intent": "",
  "draft_job_request": {
    "city": "",
    "service_type": "",
    "description": "",
    "budget_min": 0,
    "budget_max": 0,
    "scheduled_at": ""
  },
  "classification": {
    "service_type": "",
    "urgency": "",
    "budget_segment": "",
    "additional_services": []
  },
  "estimated_price": {
    "min_price": 0,
    "max_price": 0,
    "estimated_days": 0,
    "comment": ""
  },
  "repair_steps": [],
  "recommended_providers": [],
  "missing": []
}

Правила:
- Если description заполнен хотя бы коротким понятным описанием, НЕ добавляй "description" в missing.
- Для заявки обязательно missing может содержать только реально пустые поля.
- intent: create_job_request, repair_advice, recommend_providers, improve_description, price_estimate, general_question.
- Города: Астана, Алматы, Шымкент, Атырау, Актобе, Тараз.
- Атана/Астна/Нур-Султан = Астана.
- Алмыта/Алмата = Алматы.
- Типы услуг: Электромонтаж, Сантехника, Плитка, Покраска, Штукатурка, Ремонт под ключ, Натяжные потолки, Другое.
- Электрика/проводка/розетки = Электромонтаж.
- Трубы/кран/унитаз/душ = Сантехника.
- 300к = 300000, 1 млн = 1000000, семсот тысяч = 700000.
- Если один бюджет, budget_min=budget, budget_max=budget*1.2.
- scheduled_at возвращай в RFC3339.
- Если чего-то не хватает для заявки, добавь в missing: city, service_type, description, budget, scheduled_at.
- Цены называй ориентировочными.
- Если пользователь пишет "до 1 млн", "до 700к", "не больше 500 тысяч", "максимум 300к", это верхняя граница бюджета:
  budget_min = 0,
  budget_max = указанная сумма.
- Не умножай budget_max на 1.2, если пользователь указал "до", "максимум", "не больше".
- Умножай на 1.2 только если пользователь указал примерный один бюджет без слова "до".
- Если пользователь пишет "на июль", "в июле", "июль" — scheduled_at = первое число этого месяца в текущем году в RFC3339.
- Месяцы:
январь=01, февраль=02, март=03, апрель=04, май=05, июнь=06, июль=07, август=08, сентябрь=09, октябрь=10, ноябрь=11, декабрь=12.
- Пример: "на июль" = 2026-07-01T00:00:00Z.
- Если месяц текущего года уже прошёл, используй следующий год.
`,
		now.Format("2006-01-02"),
		contextJSON,
		req.Message,
	)
}

func normalizeResponse(resp *domain.AIChatResponse) {
	if resp.Intent == "" {
		resp.Intent = "general_question"
	}

	if resp.Message == "" {
		resp.Message = "Я обработал ваш запрос."
	}

	if resp.DraftJobRequest != nil {
		if resp.DraftJobRequest.BudgetMin > 0 && resp.DraftJobRequest.BudgetMax == 0 {
			resp.DraftJobRequest.BudgetMax = resp.DraftJobRequest.BudgetMin * 1.2
		}
	}
}
