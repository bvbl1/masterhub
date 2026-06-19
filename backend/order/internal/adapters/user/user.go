package user

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/order/internal/ports"
	userpb "github.com/bvbl1/masterhub-proto/golang/user"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	user userpb.UserServiceClient
}

func NewAdapter(userServiceUrl string) (*Adapter, error) {
	conn, err := grpc.NewClient(userServiceUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &Adapter{
		user: userpb.NewUserServiceClient(conn),
	}, nil
}

func (a *Adapter) GetUserByID(ctx context.Context, userID int64) (ports.User, error) {
	// extract token from incoming context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ports.User{}, fmt.Errorf("missing metadata")
	}

	// forward it as outgoing metadata
	outCtx := metadata.NewOutgoingContext(ctx, md)

	res, err := a.user.GetUserById(outCtx, &userpb.GetUserRequestById{
		UserId: userID,
	})
	if err != nil {
		return ports.User{}, err
	}

	return ports.User{
		ID:    res.User.Id,
		Role:  res.User.Role,
		Email: res.User.Email,
	}, nil
}
