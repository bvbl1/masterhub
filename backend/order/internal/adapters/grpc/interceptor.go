package grpc

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/Rask1lll/masterhub/backend/order/config"
	"github.com/Rask1lll/masterhub/backend/order/internal/application/core/domain" // your order domain (contains Claims if shared, or adjust import)
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

	// ====================== PUBLIC METHODS (no auth required) ======================
	// For order-service we have NO public methods.
	// GetOrder / ListOrders still require authentication (only parties can see orders).
	publicMethods := map[string]bool{
		// Add here only if you really want something public in the future
		"/order.v1.OrderService/UpdateOrderStatus": true,
	}

	if publicMethods[info.FullMethod] {
		return handler(ctx, req)
	}

	// ====================== EXTRACT TOKEN ======================
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

	// ====================== INJECT USER INFO INTO CONTEXT ======================
	newCtx := context.WithValue(ctx, ctxUserID, claims.UserID)
	newCtx = context.WithValue(newCtx, ctxRole, claims.Role)

	// ====================== ROLE-BASED PROTECTION ======================

	// Provider-only methods
	providerOnlyMethods := map[string]bool{
		"/order.v1.OrderService/AcceptOrder":  true,
		"/order.v1.OrderService/RejectOrder":  true,
		"/order.v1.OrderService/MarkComplete": true,
	}

	if providerOnlyMethods[info.FullMethod] {
		if claims.Role != domain.RoleProvider && claims.Role != domain.RoleAdmin {
			return nil, status.Error(codes.PermissionDenied, "provider or admin role required")
		}
	}

	// Customer-only methods
	customerOnlyMethods := map[string]bool{
		"/order.v1.OrderService/CreateOrder":     true,
		"/order.v1.OrderService/PayOrder":        true,
		"/order.v1.OrderService/CancelOrder":     true,
		"/order.v1.OrderService/ConfirmComplete": true,
		"/order.v1.OrderService/DisputeOrder":    true,
	}

	if customerOnlyMethods[info.FullMethod] {
		if claims.Role != domain.RoleCustomer && claims.Role != domain.RoleAdmin {
			return nil, status.Error(codes.PermissionDenied, "customer or admin role required")
		}
	}

	// UpdateOrderStatus is internal (called by payment-service).
	// We still require a valid token, but we do NOT enforce customer/provider role
	// (payment-service can call it with any authenticated service token).
	if info.FullMethod == "/order.v1.OrderService/UpdateOrderStatus" {
		// You can add extra check later (e.g. special "service" role) if needed
	}

	// ====================== CONTINUE TO HANDLER ======================
	return handler(newCtx, req)
}
