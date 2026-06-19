package email

import (
	"embed"
	"fmt"
	"strings"
)

//go:embed templates/base.html
var baseTemplateFS embed.FS

type TemplateData map[string]interface{}

type TemplateRenderer struct {
	baseTemplate string
}

func NewTemplateRenderer() (*TemplateRenderer, error) {
	baseBytes, err := baseTemplateFS.ReadFile("templates/base.html")
	if err != nil {
		return nil, fmt.Errorf("load base template: %w", err)
	}

	return &TemplateRenderer{
		baseTemplate: string(baseBytes),
	}, nil
}

// RenderEmail renders a beautiful email from title and body
func (tr *TemplateRenderer) RenderEmail(title, body string) string {
	result := tr.baseTemplate
	result = strings.Replace(result, "{{TITLE}}", title, 1)
	result = strings.Replace(result, "{{BODY}}", body, 1)
	return result
}

// GetSubjectForType returns a nice subject line based on notification type
func GetSubjectForType(notificationType string) string {
	subjects := map[string]string{
		"new_order_request": "📦 New Service Request",
		"order_accepted":    "✅ Order Accepted",
		"order_confirmed":   "💳 Payment Confirmed",
		"order_rejected":    "❌ Order Rejected",
		"order_cancelled":   "🚫 Order Cancelled",
		"order_disputed":    "⚠️  Order Dispute",
		"job_completed":     "🎉 Service Completed",
		"dispute_resolved":  "✔️  Dispute Resolved",
		"new_bid":           "💰 New Bid Received",
		"bid_accepted":      "🎊 Bid Accepted",
		"review":            "⭐ New Review Received",
	}

	if subject, ok := subjects[notificationType]; ok {
		return subject
	}
	return "Notification"
}
