package grpc

import (
	"context"
	"strings"

	"github.com/Rask1lll/masterhub/backend/notification/config"
	"github.com/Rask1lll/masterhub/backend/notification/internal/application/core/domain"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return handler(ctx, req)
	}

	auth := md["authorization"]
	if len(auth) == 0 {
		return handler(ctx, req) // SendNotification will still work
	}

	tokenStr := strings.TrimPrefix(auth[0], "Bearer ")
	claims := &domain.Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return []byte(config.GetJWTSecret()), nil
	})
	if err != nil || !token.Valid {
		return handler(ctx, req)
	}

	newCtx := context.WithValue(ctx, "user_id", claims.UserID)
	return handler(newCtx, req)
}
