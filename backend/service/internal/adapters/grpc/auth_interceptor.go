package grpc

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/Rask1lll/masterhub/backend/service/config"
	"github.com/Rask1lll/masterhub/backend/service/internal/application/core/domain"
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

	// public methods — browsing services doesn't require auth
	publicMethods := map[string]bool{
		"/service.v1.ServiceService/GetService":          true,
		"/service.v1.ServiceService/ListServices":        true,
		"/service.v1.ServiceService/ListCities":          true,
		"/service.v1.ServiceService/AvgPriceForCategory": true,
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

	log.Printf("DEBUG: claims.Role = [%s], claims.UserID = %d", claims.Role, claims.UserID)

	// inject into context
	newCtx := context.WithValue(ctx, ctxUserID, claims.UserID)
	newCtx = context.WithValue(newCtx, ctxRole, claims.Role)

	// provider-only methods
	providerOnlyMethods := map[string]bool{
		"/service.v1.ServiceService/CreateService": true,
		"/service.v1.ServiceService/UpdateService": true,
		"/service.v1.ServiceService/DeleteService": true,
	}
	if providerOnlyMethods[info.FullMethod] {
		if claims.Role != domain.RoleProvider && claims.Role != domain.RoleAdmin {
			return nil, status.Error(codes.PermissionDenied, "provider or admin role required")
		}
	}

	return handler(newCtx, req)
}
