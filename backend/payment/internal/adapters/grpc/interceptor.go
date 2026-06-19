package grpc

import (
	"context"
	"log"
	"strings"

	"github.com/Rask1lll/masterhub/backend/payment/internal/application/core/domain"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type contextKey string

const ClaimsKey contextKey = "claims"

// publicMethods are callable without a JWT (internal service-to-service calls).
var publicMethods = map[string]bool{
	"/payment.v1.PaymentService/Charge": true,
}

func AuthInterceptor(secret string) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		log.Printf("DEBUG Interceptor: Called for method %s", info.FullMethod)
		if publicMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			log.Printf("DEBUG: no incoming metadata")
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}

		log.Printf("DEBUG: metadata keys: %v", md)
		vals := md.Get("authorization")
		log.Printf("DEBUG: authorization header count: %d", len(vals))
		if len(vals) == 0 {
			return nil, status.Error(codes.Unauthenticated, "missing authorization header")
		}

		tokenStr := strings.TrimPrefix(vals[0], "Bearer ")
		claims := &domain.Claims{}
		_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
			return []byte(secret), nil
		})
		if err != nil {
			return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
		}

		ctx = context.WithValue(ctx, ClaimsKey, claims)
		return handler(ctx, req)
	}
}
