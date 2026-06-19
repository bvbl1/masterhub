package grpc

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/Rask1lll/masterhub/backend/user/config"
	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/domain"
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

func AuthInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	log.Printf("DEBUG Interceptor: Called for method %s", info.FullMethod)

	// public methods
	publicMethods := map[string]bool{
		"/user.v1.UserService/CreateUser":            true,
		"/user.v1.UserService/Login":                 true,
		"/user.v1.UserService/GetGoogleAuthURL":      true,
		"/user.v1.UserService/GoogleAuthCallback":    true,
		"/user.v1.UserService/GenerateTelegramToken": true,
		"/user.v1.UserService/LinkTelegramByToken":   true,
	}
	if publicMethods[info.FullMethod] {
		return handler(ctx, req)
	}

	// protected methods
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok || len(md["authorization"]) == 0 {
		return nil, status.Error(codes.Unauthenticated, "authorization required")
	}

	tokenStr := strings.TrimPrefix(md["authorization"][0], "Bearer ")
	claims := &domain.Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(config.GetJWTSecret()), nil
	})
	if err != nil || !token.Valid {
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}

	// puting in context
	newCtx := context.WithValue(ctx, ctxUserID, claims.UserID)
	newCtx = context.WithValue(newCtx, ctxRole, claims.Role)

	// Admin-only
	adminOnlyMethods := map[string]bool{
		"/user.v1.UserService/ListUsers": true,
		// "/user.v1.UserService/UpdateUser":     true,
		"/user.v1.UserService/GetUserByPhone": true,
		"/user.v1.UserService/GetUserByEmail": true,
		// "/user.v1.UserService/GetUserById":    true,
		// we will add here more methods in future
	}
	if adminOnlyMethods[info.FullMethod] {
		role := claims.Role
		if role != domain.RoleAdmin {
			return nil, status.Error(codes.PermissionDenied, "admin role required")
		}
	}

	return handler(newCtx, req)
}
