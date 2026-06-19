package grpc

import (
	"context"

	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/domain"
	categorypb "github.com/bvbl1/masterhub-proto/golang/category"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) CreateCategory(ctx context.Context, req *categorypb.CreateCategoryRequest) (*categorypb.CreateCategoryResponse, error) {
	category := domain.Category{
		CategoryName: req.Name,
		Description:  req.Description,
		Icon:         req.Icon,
	}

	res, err := a.api.CreateCategory(ctx, category)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create category: %v", err)
	}

	return &categorypb.CreateCategoryResponse{
		Category: toProtoCategory(res),
	}, nil
}

func (a *Adapter) ListCategories(ctx context.Context, req *categorypb.ListCategoriesRequest) (*categorypb.ListCategoriesResponse, error) {
	categories, err := a.api.ListCategories(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch categories: %v", err)
	}

	var toProtoCategories []*categorypb.Category
	for _, category := range categories {
		toProtoCategories = append(toProtoCategories, toProtoCategory(category))
	}

	return &categorypb.ListCategoriesResponse{
		Categories: toProtoCategories,
	}, nil
}

func (a *Adapter) GetCategory(ctx context.Context, req *categorypb.GetCategoryRequest) (*categorypb.GetCategoryResponse, error) {
	category, err := a.api.GetCategory(ctx, req.Id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to fetch category: %v", err)
	}
	return &categorypb.GetCategoryResponse{
		Category: toProtoCategory(category),
	}, nil
}

func (a *Adapter) UpdateCategory(ctx context.Context, req *categorypb.UpdateCategoryRequest) (*categorypb.UpdateCategoryResponse, error) {
	category, err := a.api.UpdateCategory(ctx, req.Id, req.Name, req.Description, req.Icon)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update category: %v", err)
	}
	return &categorypb.UpdateCategoryResponse{
		Category: toProtoCategory(category),
	}, nil
}

func (a *Adapter) DeleteCategory(ctx context.Context, req *categorypb.DeleteCategoryRequest) (*categorypb.DeleteCategoryResponse, error) {
	if err := a.api.DeleteCategory(ctx, req.Id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete category: %v", err)
	}
	return &categorypb.DeleteCategoryResponse{
		Success: true,
	}, nil
}

func toProtoCategory(c domain.Category) *categorypb.Category {
	return &categorypb.Category{
		Id:          c.CategoryId,
		Name:        c.CategoryName,
		Description: c.Description,
		Icon:        c.Icon,
	}
}
