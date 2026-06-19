package domain

// in the future we need to add specific errors into domain/user.go for better logging and understanding.
const (
	RoleAdmin    = "admin"
	RoleCustomer = "customer"
	RoleProvider = "provider"
)

type User struct {
	UserId         int64  `json:"id"`
	FirstName      string `json:"first_name"`
	SecondName     string `json:"second_name"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Password       string `json:"password"`
	Role           string `json:"role"`
	GoogleId       string `json:"google_id"`
	AvatarUrl      string `json:"avatar_url"`
	AuthProvider   string `json:"auth_provider"` //"local" | "google"
	TelegramChatId int64
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

func (u *User) IsCustomer() bool {
	return u.Role == RoleCustomer
}

func (u *User) IsProvider() bool {
	return u.Role == RoleProvider
}
