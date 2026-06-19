package api

import (
	"context"
	"fmt"

	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/domain"
	"github.com/Rask1lll/masterhub/backend/category/internal/ports"
)

type Application struct {
	db ports.DBPort
}

func NewApplication(db ports.DBPort) *Application {
	return &Application{
		db: db,
	}
}

func (a *Application) CreateCategory(ctx context.Context, category domain.Category) (domain.Category, error) {
	userRole, ok := ctx.Value("role").(string)
	if !ok || userRole != "admin" {
		return domain.Category{}, fmt.Errorf("unauthorized: only admin can create categories")
	}

	res, err := a.db.Create(ctx, category)
	if err != nil {
		return domain.Category{}, fmt.Errorf("create category: %w", err)
	}
	return res, nil
}

func (a *Application) GetCategory(ctx context.Context, id int64) (domain.Category, error) {
	category, err := a.db.GetByID(ctx, id)
	if err != nil {
		return domain.Category{}, fmt.Errorf("get category by id: %w", err)
	}
	return category, nil
}

func (a *Application) ListCategories(ctx context.Context) ([]domain.Category, error) {
	categories, err := a.db.List(ctx)

	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}

	return categories, nil
}

func (a *Application) UpdateCategory(ctx context.Context, id int64, name, description, icon string) (domain.Category, error) {
	userRole, ok := ctx.Value("role").(string)
	if !ok || userRole != "admin" {
		return domain.Category{}, fmt.Errorf("unauthorized: only admin can update categories")
	}

	// retrieving existing category
	existing, err := a.db.GetByID(ctx, id)
	if err != nil {
		return domain.Category{}, fmt.Errorf("failed to get category for update: %w", err)
	}

	// change name
	existing.CategoryName = name
	existing.Description = description
	existing.Icon = icon

	// save changes
	err = a.db.Update(ctx, existing)
	if err != nil {
		return domain.Category{}, fmt.Errorf("failed to update category: %w", err)
	}

	return existing, nil
}

func (a *Application) DeleteCategory(ctx context.Context, id int64) error {
	userRole, ok := ctx.Value("role").(string)
	if !ok || userRole != "admin" {
		return fmt.Errorf("unauthorized: only admin can delete categories")
	}

	err := a.db.Delete(ctx, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	return nil
}
