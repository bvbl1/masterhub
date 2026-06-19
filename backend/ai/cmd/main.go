package main

import (
	"log"
	"net/http"

	"github.com/joho/godotenv"

	"github.com/Rask1lll/masterhub/backend/ai/config"
	httpadapter "github.com/Rask1lll/masterhub/backend/ai/internal/adapters/http"
	"github.com/Rask1lll/masterhub/backend/ai/internal/adapters/openrouter"
	"github.com/Rask1lll/masterhub/backend/ai/internal/application/core/api"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	if !cfg.AIEnabled {
		log.Fatal("AI service disabled. Set AI_ENABLED=true")
	}

	if cfg.OpenRouterKey == "" {
		log.Fatal("OPENROUTER_API_KEY is required")
	}

	aiClient := openrouter.New(cfg.OpenRouterKey, cfg.OpenRouterModel)

	log.Printf("AI provider: openrouter")
	log.Printf("OpenRouter model: %s", cfg.OpenRouterModel)

	aiService := api.New(aiClient)
	server := httpadapter.New(aiService)

	mux := http.NewServeMux()
	server.RegisterRoutes(mux)

	addr := ":" + cfg.Port

	log.Printf("AI service started on %s", addr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
