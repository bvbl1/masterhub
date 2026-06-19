package db

import (
	"context"
	"log"

	"github.com/Rask1lll/masterhub/backend/category/internal/application/core/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Category struct {
	gorm.Model
	CategoryName string `gorm:"type:varchar(100);uniqueIndex;not null"`
	Description  string `gorm:"type:text;not null"`
	Icon         string `gorm:"type:varchar(255)"`
}

type Adapter struct {
	db *gorm.DB
}

func NewAdapter(dsn string) (*Adapter, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&Category{})
	if err != nil {
		return nil, err
	}

	if err := seedCategories(db); err != nil {
		log.Printf("Warning: failed to seed categories: %v", err)
	}

	return &Adapter{db: db}, nil
}

func (a *Adapter) Create(ctx context.Context, category domain.Category) (domain.Category, error) {
	categoryModel := Category{
		CategoryName: category.CategoryName,
		Description:  category.Description,
		Icon:         category.Icon,
	}

	res := a.db.WithContext(ctx).Create(&categoryModel)
	if res.Error != nil {
		return domain.Category{}, res.Error
	}

	return domain.Category{
		CategoryId:   int64(categoryModel.ID),
		CategoryName: categoryModel.CategoryName,
		Description:  categoryModel.Description,
		Icon:         categoryModel.Icon,
	}, nil
}

func (a *Adapter) GetByID(ctx context.Context, id int64) (domain.Category, error) {
	var categoryModel Category

	res := a.db.WithContext(ctx).First(&categoryModel, id)
	if res.Error != nil {
		return domain.Category{}, res.Error
	}

	return domain.Category{
		CategoryId:   int64(categoryModel.ID),
		CategoryName: categoryModel.CategoryName,
		Description:  categoryModel.Description,
		Icon:         categoryModel.Icon,
	}, nil
}

func (a *Adapter) List(ctx context.Context) ([]domain.Category, error) {
	var categoryModels []Category

	res := a.db.WithContext(ctx).Find(&categoryModels)
	if res.Error != nil {
		return nil, res.Error
	}

	categories := make([]domain.Category, 0, len(categoryModels))
	for _, model := range categoryModels {
		categories = append(categories, domain.Category{
			CategoryId:   int64(model.ID),
			CategoryName: model.CategoryName,
			Description:  model.Description,
			Icon:         model.Icon,
		})
	}

	return categories, nil
}

func (a *Adapter) Update(ctx context.Context, category domain.Category) error {
	var categoryModel Category

	res := a.db.WithContext(ctx).First(&categoryModel, category.CategoryId)
	if res.Error != nil {
		return res.Error
	}

	categoryModel.CategoryName = category.CategoryName
	categoryModel.Description = category.Description
	categoryModel.Icon = category.Icon

	res = a.db.WithContext(ctx).Save(&categoryModel)
	if res.Error != nil {
		return res.Error
	}

	return nil
}

func (a *Adapter) Delete(ctx context.Context, id int64) error {
	res := a.db.WithContext(ctx).Delete(&Category{}, id)
	if res.Error != nil {
		return res.Error
	}

	return nil
}
