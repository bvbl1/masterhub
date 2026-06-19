package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/Rask1lll/masterhub/backend/chat/config"
	"github.com/Rask1lll/masterhub/backend/chat/internal/adapters/db"
	grpcadapter "github.com/Rask1lll/masterhub/backend/chat/internal/adapters/grpc"
	wsadapter "github.com/Rask1lll/masterhub/backend/chat/internal/adapters/websocket"
	"github.com/Rask1lll/masterhub/backend/chat/internal/application/core/api"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbAdapter, err := db.NewAdapter(config.GetDataSourceUrl())
	if err != nil {
		log.Fatalf("chat service failed to connect to database: %v", err)
	}

	application := api.NewAdapter(dbAdapter)

	// gRPC server — internal only, runs in background
	grpcAdapter := grpcadapter.NewAdapter(application, config.GetApplicationPOrt())
	go grpcAdapter.Run()

	// WebSocket handler
	wsHandler := wsadapter.NewHandler(application, config.GetJWTSecret())

	// Single HTTP mux — Railway only exposes one port
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", wsHandler.ServeWS)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	port := config.GetPort()
	addr := fmt.Sprintf(":%d", port)
	log.Printf("HTTP/WebSocket server listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("HTTP server failed: %v", err)
	}
}
