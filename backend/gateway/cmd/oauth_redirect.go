package main

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	pb "github.com/bvbl1/masterhub-proto/golang/user"
	"google.golang.org/grpc"
	"google.golang.org/grpc/status"
)

// Браузер после Google попадает на backend callback URL; если отдать JSON, пользователь
// «застревает» на :8080. Перехватываем этот GET, дергаем user-service по gRPC и
// отправляем на фронт с токеном в query — как ожидает /auth/callback.
func wrapGoogleOAuthRedirect(next http.Handler, userConn *grpc.ClientConn) http.Handler {
	client := pb.NewUserServiceClient(userConn)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimSuffix(r.URL.Path, "/")
		if path != "/v1/auth/google/callback" || r.Method != http.MethodGet {
			next.ServeHTTP(w, r)
			return
		}

		code := r.URL.Query().Get("code")
		if code == "" {
			http.Redirect(w, r, oauthLoginErrorRedirect("Missing authorization code from Google."), http.StatusFound)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
		defer cancel()

		resp, err := client.GoogleAuthCallback(ctx, &pb.GoogleAuthCallbackRequest{
			Code:  code,
			State: r.URL.Query().Get("state"),
		})
		if err != nil {
			msg := status.Convert(err).Message()
			if msg == "" {
				msg = "Google sign-in failed."
			}
			log.Printf("google oauth callback grpc error: %v", err)
			http.Redirect(w, r, oauthLoginErrorRedirect(msg), http.StatusFound)
			return
		}

		token := resp.GetToken()
		if token == "" {
			http.Redirect(w, r, oauthLoginErrorRedirect("Empty token from auth service."), http.StatusFound)
			return
		}

		frontendBase := strings.TrimSuffix(strings.TrimSpace(os.Getenv("FRONTEND_BASE_URL")), "/")
		if frontendBase == "" {
			frontendBase = "http://localhost:3000"
		}

		targetStr := frontendBase + "/auth/callback"
		target, err := url.Parse(targetStr)
		if err != nil || target.Scheme == "" || target.Host == "" {
			log.Printf("invalid FRONTEND_BASE_URL for redirect: %q", frontendBase)
			http.Redirect(w, r, oauthLoginErrorRedirect("Server misconfiguration for OAuth redirect."), http.StatusFound)
			return
		}

		q := target.Query()
		q.Set("token", token)
		target.RawQuery = q.Encode()

		http.Redirect(w, r, target.String(), http.StatusFound)
	})
}

func oauthLoginErrorRedirect(userMessage string) string {
	base := strings.TrimSuffix(strings.TrimSpace(os.Getenv("FRONTEND_BASE_URL")), "/")
	if base == "" {
		base = "http://localhost:3000"
	}
	u, err := url.Parse(base + "/login")
	if err != nil {
		u, _ = url.Parse("http://localhost:3000/login")
	}
	q := url.Values{}
	q.Set("oauth_error", userMessage)
	u.RawQuery = q.Encode()
	return u.String()
}
