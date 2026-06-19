package bot

import (
	"context"
	"fmt"
	"strings"

	"github.com/Rask1lll/masterhub/backend/telegram/internal/application/core/domain"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func grpcAuthContext(sess *domain.UserSession) (context.Context, error) {
	token := strings.TrimSpace(sess.Token)
	if token == "" {
		return nil, fmt.Errorf("missing token")
	}
	md := metadata.New(map[string]string{
		"authorization": "Bearer " + token,
	})
	return metadata.NewOutgoingContext(context.Background(), md), nil
}

func grpcErrorMessage(err error) string {
	if st, ok := status.FromError(err); ok && st.Message() != "" {
		return st.Message()
	}
	return err.Error()
}

func isUnauthenticated(err error) bool {
	if st, ok := status.FromError(err); ok {
		return st.Code() == codes.Unauthenticated
	}
	return false
}
