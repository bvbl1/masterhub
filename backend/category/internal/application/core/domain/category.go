package domain

type Category struct {
	CategoryId   int64  `json:"id"`
	CategoryName string `json:"category_name"`
	Description  string `json:"description"`
	Icon         string `json:"icon"`
}
