package http

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/Rask1lll/masterhub/backend/payment/internal/ports"
	stripe "github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"
)

type WebhookAdapter struct {
	api           ports.APIPort
	webhookSecret string
}

func NewWebhookAdapter(api ports.APIPort, webhookSecret string) *WebhookAdapter {
	return &WebhookAdapter{api: api, webhookSecret: webhookSecret}
}

func (w *WebhookAdapter) Run(port int) {
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/payments/webhook", w.HandleWebhook)

	addr := fmt.Sprintf(":%d", port)
	log.Printf("payment-service: webhook HTTP listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("payment-service: webhook server failed: %v", err)
	}
}

func (w *WebhookAdapter) HandleWebhook(rw http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(rw, "cannot read body", http.StatusBadRequest)
		return
	}

	// Верифицируем подпись Stripe — защита от фейковых запросов.
	event, err := webhook.ConstructEventWithOptions(
		body,
		r.Header.Get("Stripe-Signature"),
		w.webhookSecret,
		webhook.ConstructEventOptions{
			IgnoreAPIVersionMismatch: true,
		},
	)
	if err != nil {
		log.Printf("webhook: invalid signature: %v", err)
		http.Error(rw, "invalid signature", http.StatusUnauthorized)
		return
	}

	switch event.Type {

	case "payment_intent.succeeded":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			log.Printf("webhook: cannot parse payment_intent: %v", err)
			http.Error(rw, "parse error", http.StatusInternalServerError)
			return
		}

		log.Printf("webhook: payment_intent.succeeded — pi=%s", pi.ID)

		// ConfirmPayment внутри сам:
		// 1. Обновляет Payment.status = "paid" в БД
		// 2. Вызывает order-service.UpdateOrderStatus(in_progress)
		// orderID нам здесь не нужен — всё делается внутри api.go.
		_, err := w.api.ConfirmPayment(context.Background(), pi.ID)
		if err != nil {
			log.Printf("webhook: ConfirmPayment failed for pi=%s: %v", pi.ID, err)
			// Возвращаем 500 — Stripe повторит webhook через некоторое время.
			http.Error(rw, "internal error", http.StatusInternalServerError)
			return
		}

		log.Printf("webhook: order moved to in_progress for pi=%s", pi.ID)

	case "payment_intent.payment_failed":
		var pi stripe.PaymentIntent
		if err := json.Unmarshal(event.Data.Raw, &pi); err != nil {
			log.Printf("webhook: cannot parse failed payment_intent: %v", err)
			http.Error(rw, "parse error", http.StatusInternalServerError)
			return
		}

		log.Printf("webhook: payment_intent.payment_failed — pi=%s", pi.ID)

		// Обновляем статус на "failed" чтобы клиент видел что оплата не прошла.
		if err := w.api.UpdatePaymentStatusFailed(context.Background(), pi.ID); err != nil {
			log.Printf("webhook: failed to mark payment as failed for pi=%s: %v", pi.ID, err)
			http.Error(rw, "internal error", http.StatusInternalServerError)
			return
		}

	default:
		// Остальные события игнорируем — просто отвечаем 200.
		log.Printf("webhook: unhandled event type %s", event.Type)
	}

	// 200 OK — Stripe считает webhook доставленным.
	rw.WriteHeader(http.StatusOK)
}
