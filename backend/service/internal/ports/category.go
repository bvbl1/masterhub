package ports

import "context"

type Category interface {
	GetCategoryById(ctx context.Context, id int64) error
}
