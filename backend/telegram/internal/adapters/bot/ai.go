package bot

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
)

type AIHelper struct {
	apiKey string
	client *http.Client
}

type ParsedOrder struct {
	City        string   `json:"city"`
	ServiceType string   `json:"service_type"`
	Description string   `json:"description"`
	BudgetMin   float64  `json:"budget_min"`
	BudgetMax   float64  `json:"budget_max"`
	ScheduledAt string   `json:"scheduled_at"`
	Missing     []string `json:"missing"`
}

func NewAIHelper(apiKey string) *AIHelper {
	return &AIHelper{
		apiKey: apiKey,
		client: &http.Client{
			Timeout: 25 * time.Second,
		},
	}
}

func (a *AIHelper) callGemini(prompt string, maxTokens int) (string, error) {
	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]string{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature":     0.1,
			"maxOutputTokens": maxTokens,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=%s",
		a.apiKey,
	)

	req, err := http.NewRequestWithContext(context.Background(), "POST", url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode == 429 {
		return "", fmt.Errorf("gemini quota/rate limit: %s", string(respBody))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("gemini status %d: %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("decode gemini response: %w — body: %s", err, string(respBody))
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty gemini response: %s", string(respBody))
	}

	text := strings.TrimSpace(result.Candidates[0].Content.Parts[0].Text)
	log.Printf("Gemini raw response: %s", text)

	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	log.Printf("Gemini cleaned response: %s", text)
	return text, nil
}

func (a *AIHelper) ParseOrderFromText(userText string, current *ParsedOrder) (*ParsedOrder, error) {
	now := time.Now()

	currentJSON, _ := json.Marshal(current)

	prompt := fmt.Sprintf(`
Ты — AI-помощник маркетплейса ремонтных услуг MasterHub в Казахстане.

Сегодня: %s.
Текущий год: %d.

Пользователь пишет заявку на ремонт свободным текстом.
Он может писать с ошибками, неполно, на русском или казахском.

Твоя задача — понять смысл и вернуть ТОЛЬКО JSON без markdown и пояснений.

Текущая частично заполненная заявка:
%s

Новое сообщение пользователя:
%s

Верни JSON строго такого формата:
{
  "city": "",
  "service_type": "",
  "description": "",
  "budget_min": 0,
  "budget_max": 0,
  "scheduled_at": "",
  "missing": []
}

Правила:

1. city:
- Только один из списка: Астана, Алматы, Шымкент, Атырау, Актобе, Тараз.
- Исправляй ошибки:
  Атана, Астна, Нур-Султан, Нурсултан, astana = Астана.
  Алмыта, Алмата, almaty = Алматы.
  Шымкет, шымкент = Шымкент.
- Если город не указан и его нет в текущей заявке — city="" и добавь "city" в missing.

2. service_type:
- Только один из:
  Электромонтаж, Сантехника, Плитка, Покраска, Штукатурка, Ремонт под ключ, Натяжные потолки, Другое.
- Электрика, проводка, розетки, свет, выключатели = Электромонтаж.
- Трубы, унитаз, кран, душ, смеситель, раковина = Сантехника.
- Кафель, плитка = Плитка.
- Обои, краска, покрасить = Покраска.
- Если не понятно — Другое.
- Если вообще нет услуги и её нет в текущей заявке — service_type="" и добавь "service_type" в missing.

3. description:
- Составь понятное описание задачи.
- Не пиши слишком коротко.
- Если описание уже есть в текущей заявке, сохрани его и дополни новым сообщением.
- Если описания нет — добавь "description" в missing.

4. budget:
- Семсот тысяч = 700000.
- 700к = 700000.
- 1 млн = 1000000.
- 1.5 млн = 1500000.
- Полмиллиона = 500000.
- Если указан один бюджет, budget_min = сумма, budget_max = сумма * 1.2.
- Если пользователь написал "до 700 тысяч", budget_min = 0, budget_max = 700000.
- Если бюджет не указан и его нет в текущей заявке — budget_min=0, budget_max=0 и добавь "budget" в missing.

5. scheduled_at:
- Верни дату строго в RFC3339, например: 2026-05-20T00:00:00Z.
- Сегодня = сегодняшняя дата.
- Завтра = +1 день.
- Послезавтра = +2 дня.
- На этой неделе / в эту неделю / в неделе / на неделе = +3 дня.
- Через неделю / следующая неделя = +7 дней.
- Через две недели = +14 дней.
- Через месяц = +30 дней.
- Срочно / asap / быстрее = завтра.
- 20 мая = 20 мая текущего года, если дата уже прошла — следующий год.
- Если дата не указана и её нет в текущей заявке — scheduled_at="" и добавь "scheduled_at" в missing.

6. missing:
- Добавляй только реально отсутствующие поля.
- Возможные значения:
  city, service_type, description, budget, scheduled_at.
- Если всё заполнено, missing=[].

Важно:
- Всегда сохраняй уже заполненные данные из текущей заявки, если пользователь не заменил их явно.
- Верни только валидный JSON.
`,
		now.Format("2006-01-02"),
		now.Year(),
		string(currentJSON),
		userText,
	)

	raw, err := a.callGemini(prompt, 300)
	if err != nil {
		return nil, err
	}

	var parsed ParsedOrder
	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return nil, fmt.Errorf("parse JSON: %w — raw: %s", err, raw)
	}

	if parsed.BudgetMin > 0 && parsed.BudgetMax == 0 {
		parsed.BudgetMax = parsed.BudgetMin * 1.2
	}

	if parsed.ScheduledAt != "" {
		if _, err := time.Parse(time.RFC3339, parsed.ScheduledAt); err != nil {
			parsed.ScheduledAt = ""
			parsed.Missing = appendMissing(parsed.Missing, "scheduled_at")
		}
	}

	return &parsed, nil
}

func appendMissing(items []string, value string) []string {
	for _, item := range items {
		if item == value {
			return items
		}
	}
	return append(items, value)
}
