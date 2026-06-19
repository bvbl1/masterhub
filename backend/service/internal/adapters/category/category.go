package category

import (
	"context"
	"fmt"

	categorypb "github.com/bvbl1/masterhub-proto/golang/category"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

type Adapter struct {
	category categorypb.CategoryServiceClient
}

func NewAdapter(categoryServiceUrl string) (*Adapter, error) {
	conn, err := grpc.NewClient(categoryServiceUrl, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	return &Adapter{
		category: categorypb.NewCategoryServiceClient(conn),
	}, nil
}

func (a *Adapter) GetCategoryById(ctx context.Context, id int64) error {
	// extract token from incoming context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return fmt.Errorf("missing metadata")
	}

	// forward it as outgoing metadata
	outCtx := metadata.NewOutgoingContext(ctx, md)

	_, err := a.category.GetCategory(outCtx, &categorypb.GetCategoryRequest{Id: id})
	if err != nil {
		return fmt.Errorf("get category by id: %w", err)
	}
	return nil
}
