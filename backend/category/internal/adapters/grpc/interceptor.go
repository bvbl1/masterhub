package grpc

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/Rask1lll/masterhub/backend/category/config"
	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/domain"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

const (
	ctxUserID = "user_id"
	ctxRole   = "role"
)

var publicMethods = map[string]bool{
	"/category.v1.CategoryService/ListCategories": true,
	"/category.v1.CategoryService/GetCategory":    true,
}

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	log.Printf("DEBUG Interceptor: Called for method %s", info.FullMethod)

	// Check if the method is public
	if publicMethods[info.FullMethod] {
		return handler(ctx, req)
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok || len(md["authorization"]) == 0 {
		return nil, status.Error(codes.Unauthenticated, "authorization header required")
	}

	tokenStr := strings.TrimPrefix(md["authorization"][0], "Bearer ")
	if tokenStr == md["authorization"][0] {
		tokenStr = strings.TrimSpace(tokenStr)
	}

	claims := &domain.Claims{}

	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(config.GetJWTSecret()), nil
	})

	if err != nil || !token.Valid {
		return nil, status.Error(codes.Unauthenticated, "invalid or expired token")
	}

	newCtx := context.WithValue(ctx, ctxUserID, claims.UserID)
	newCtx = context.WithValue(newCtx, ctxRole, claims.Role)

	return handler(newCtx, req)
}
