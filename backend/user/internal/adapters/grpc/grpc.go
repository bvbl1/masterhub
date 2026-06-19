package grpc

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/Rask1lll/masterhub/backend/user/internal/application/core/domain"
	userpb "github.com/bvbl1/masterhub-proto/golang/user"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (a *Adapter) CreateUser(ctx context.Context, req *userpb.CreateUserRequest) (*userpb.CreateUserResponse, error) {
	//proto to domain
	user := &domain.User{
		FirstName:  req.FirstName,
		SecondName: req.SecondName,
		Email:      req.Email,
		Phone:      req.Phone,
		Password:   req.Password,
	}

	token, result, err := a.api.RegisterUser(ctx, *user)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}
	return &userpb.CreateUserResponse{
		Token:  token,
		UserId: result.UserId,
	}, nil
}

func (a *Adapter) Login(ctx context.Context, req *userpb.LoginRequest) (*userpb.LoginResponse, error) {
	token, user, err := a.api.LoginUser(ctx, req.EmailOrPhone, req.Password)
	if err != nil {
		log.Printf("DEBUG Login Handler: Error from api = %v", err) // Add this for debug

		if strings.Contains(err.Error(), "user not found") {
			return nil, status.Error(codes.Unauthenticated, "invalid credentials") // Security: obfuscate "not found"
		}
		if strings.Contains(err.Error(), "invalid password") {
			return nil, status.Error(codes.Unauthenticated, "invalid credentials")
		}
		return nil, status.Errorf(codes.Internal, "login failed: %v", err)
	}

	return &userpb.LoginResponse{
		Token: token,
		User:  toProtoUser(user),
	}, nil
}
func (a *Adapter) GetUserById(ctx context.Context, req *userpb.GetUserRequestById) (*userpb.GetUserResponse, error) {
	domainUser, err := a.api.GetUserById(ctx, req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to fetch user by id: %v", err)
	}
	return &userpb.GetUserResponse{
		User: toProtoUser(domainUser),
	}, nil
}

func (a *Adapter) GetUserByEmail(ctx context.Context, req *userpb.GetUserRequestByEmail) (*userpb.GetUserResponse, error) {
	domainUser, err := a.api.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to fetch user by email: %v", err)
	}
	return &userpb.GetUserResponse{
		User: toProtoUser(domainUser),
	}, nil
}

func (a *Adapter) GetUserByPhone(ctx context.Context, req *userpb.GetUserRequestByPhone) (*userpb.GetUserResponse, error) {
	domainUser, err := a.api.GetUserByPhone(ctx, req.Phone)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to fetch user by phone: %v", err)
	}
	return &userpb.GetUserResponse{
		User: toProtoUser(domainUser),
	}, nil
}

func (a *Adapter) GetMe(ctx context.Context, req *userpb.GetMeRequest) (*userpb.GetMeResponse, error) {
	user, err := a.api.GetMe(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to getMe: %v", err)
	}

	return &userpb.GetMeResponse{
		User: toProtoUser(user),
	}, nil
}

func (a *Adapter) ListUsers(ctx context.Context, req *userpb.ListUsersRequest) (*userpb.ListUsersResponse, error) {
	users, err := a.api.ListUsers(ctx, int(req.Limit), int(req.Offset))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to list users: %v", err)
	}

	var protoUsers []*userpb.User
	for _, user := range users {
		protoUsers = append(protoUsers, toProtoUser(user))
	}
	return &userpb.ListUsersResponse{Users: protoUsers}, nil
}

func (a *Adapter) UpdateUser(ctx context.Context, req *userpb.UpdateUserRequest) (*userpb.UpdateUserResponse, error) {
	user := &domain.User{
		UserId:     req.UserId,
		FirstName:  req.FirstName,
		SecondName: req.SecondName,
		Email:      req.Email,
		Phone:      req.Phone,
		Role:       req.Role,
	}
	updatedUser, err := a.api.UpdateUser(ctx, *user)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to update user: %v", err)
	}
	return &userpb.UpdateUserResponse{User: toProtoUser(updatedUser)}, nil
}

func (a *Adapter) PromoteToProvider(ctx context.Context, req *userpb.PromoteToProviderRequest) (*userpb.PromoteToProviderResponse, error) {
	role, token, err := a.api.PromoteToProvider(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to promote user: %v", err)
	}

	return &userpb.PromoteToProviderResponse{
		Role:  role,
		Token: token,
	}, nil
}

func (a *Adapter) GetGoogleAuthURL(ctx context.Context, req *userpb.GetGoogleAuthURLRequest) (*userpb.GetGoogleAuthURLResponse, error) {
	url, err := a.api.GetGoogleAuthURL(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate google auth url: %v", err)
	}

	return &userpb.GetGoogleAuthURLResponse{Url: url}, nil
}

func (a *Adapter) GoogleAuthCallback(ctx context.Context, req *userpb.GoogleAuthCallbackRequest) (*userpb.GoogleAuthCallbackResponse, error) {
	token, user, err := a.api.GoogleAuthCallback(ctx, req.Code, req.State)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "google auth callback failed: %v", err)
	}

	return &userpb.GoogleAuthCallbackResponse{
		Token: token,
		User: &userpb.User{
			Id:         user.UserId,
			FirstName:  user.FirstName,
			SecondName: user.SecondName,
			Email:      user.Email,
			Phone:      user.Phone,
			Role:       user.Role,
		},
	}, nil
}

func (a *Adapter) UpdateAvatar(ctx context.Context, req *userpb.UpdateAvatarRequest) (*userpb.UpdateAvatarResponse, error) {
	success, err := a.api.UpdateAvatar(ctx, req.AvatarUrl)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update avatar: %v", err)
	}
	return &userpb.UpdateAvatarResponse{Success: success}, nil
}

func (a *Adapter) SubmitProviderApplication(ctx context.Context, req *userpb.SubmitProviderApplicationRequest) (*userpb.SubmitProviderApplicationResponse, error) {
	if len(req.DocumentUrls) == 0 {
		return nil, status.Error(codes.InvalidArgument, "at least one document URL is required")
	}

	result, err := a.api.SubmitProviderApplication(ctx, req.DocumentUrls)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to submit provider application: %v", err)
	}

	return &userpb.SubmitProviderApplicationResponse{
		Application: toProtoProviderApplication(result),
	}, nil
}

func (a *Adapter) GetMyProviderApplication(ctx context.Context, req *userpb.GetMyProviderApplicationRequest) (*userpb.GetMyProviderApplicationResponse, error) {
	result, err := a.api.GetMyProviderRequest(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get provider application: %v", err)
	}

	return &userpb.GetMyProviderApplicationResponse{
		Application: toProtoProviderApplication(result),
	}, nil
}

func (a *Adapter) ListProviderApplications(ctx context.Context, req *userpb.ListProviderApplicationsRequest) (*userpb.ListProviderApplicationsResponse, error) {
	log.Printf("DEBUG: status=%q limit=%d offset=%d", req.Status, req.Limit, req.Offset)

	results, err := a.api.ListProviderRequests(ctx, req.Status, int(req.Limit), int(req.Offset))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list provider applications: %v", err)
	}

	applications := make([]*userpb.ProviderApplication, len(results))
	for i, r := range results {
		applications[i] = toProtoProviderApplication(r)
	}

	return &userpb.ListProviderApplicationsResponse{
		Applications: applications,
		Total:        int32(len(results)),
	}, nil
}

func (a *Adapter) ApproveProviderApplication(ctx context.Context, req *userpb.ApproveProviderApplicationRequest) (*userpb.ApproveProviderApplicationResponse, error) {
	result, err := a.api.ApproveProviderRequest(ctx, req.ApplicationId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to approve provider application: %v", err)
	}

	return &userpb.ApproveProviderApplicationResponse{
		Application: toProtoProviderApplication(result),
	}, nil
}

func (a *Adapter) RejectProviderApplication(ctx context.Context, req *userpb.RejectProviderApplicationRequest) (*userpb.RejectProviderApplicationResponse, error) {
	if req.RejectionReason == "" {
		return nil, status.Error(codes.InvalidArgument, "rejection_reason is required")
	}

	result, err := a.api.RejectProviderRequest(ctx, req.ApplicationId, req.RejectionReason)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to reject provider application: %v", err)
	}

	return &userpb.RejectProviderApplicationResponse{
		Application: toProtoProviderApplication(result),
	}, nil
}

func (a *Adapter) AddFavorite(ctx context.Context, req *userpb.AddFavoriteRequest) (*userpb.AddFavoriteResponse, error) {
	success, err := a.api.AddFavoriteProvider(ctx, req.ProviderId)
	if err != nil {
		if strings.Contains(err.Error(), "provider not found") {
			return nil, status.Errorf(codes.NotFound, "provider not found")
		}
		if strings.Contains(err.Error(), "user is not a provider") {
			return nil, status.Errorf(codes.InvalidArgument, "target user is not a provider")
		}
		return nil, status.Errorf(codes.Internal, "failed to add favorite provider: %v", err)
	}
	return &userpb.AddFavoriteResponse{Success: success}, nil
}
func (a *Adapter) RemoveFavorite(ctx context.Context, req *userpb.RemoveFavoriteRequest) (*userpb.RemoveFavoriteResponse, error) {
	success, err := a.api.RemoveFavoriteProvider(ctx, req.ProviderId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to remove favorite provider: %v", err)
	}
	return &userpb.RemoveFavoriteResponse{Success: success}, nil
}

func (a *Adapter) ListFavorites(ctx context.Context, req *userpb.ListFavoritesRequest) (*userpb.ListFavoritesResponse, error) {
	favorites, err := a.api.ListFavoriteProviders(ctx, int(req.Limit), int(req.Offset))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list favorite providers: %v", err)
	}

	protoFavorites := make([]*userpb.FavoriteProvider, 0, len(favorites))
	for _, f := range favorites {
		protoFavorites = append(protoFavorites, &userpb.FavoriteProvider{
			Id:         f.ID,
			FirstName:  f.FirstName,
			SecondName: f.LastName,
			AvatarUrl:  f.AvatarUrl,
			Role:       f.Role,
		})
	}
	return &userpb.ListFavoritesResponse{Providers: protoFavorites}, nil
}

func (a *Adapter) IsFavorite(ctx context.Context, req *userpb.IsFavoriteRequest) (*userpb.IsFavoriteResponse, error) {
	isFav, err := a.api.IsProviderFavorite(ctx, req.ProviderId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to check if provider is favorite: %v", err)
	}
	return &userpb.IsFavoriteResponse{IsFavorite: isFav}, nil
}

func (a *Adapter) GetAnalytics(ctx context.Context, req *userpb.GetAnalyticsRequest) (*userpb.GetAnalyticsResponse, error) {
	analytics, err := a.api.GetAnalytics(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get analytics: %v", err)
	}
	return toProtoAnalytics(analytics), nil
}

// toProtoUser converts domain user to protobuf user
func toProtoUser(u domain.User) *userpb.User {
	return &userpb.User{
		Id:         u.UserId,
		FirstName:  u.FirstName,
		SecondName: u.SecondName,
		Email:      u.Email,
		Phone:      u.Phone,
		Role:       u.Role,
		AvatarUrl:  u.AvatarUrl,
	}
}

func toProtoProviderApplication(r domain.ProviderRequest) *userpb.ProviderApplication {
	return &userpb.ProviderApplication{
		Id:              r.ID,
		UserId:          r.UserID,
		Status:          string(r.Status),
		DocumentUrls:    r.DocumentURLs,
		RejectionReason: r.RejectionReason,
		ReviewedBy:      r.ReviewedBy,
		CreatedAt:       r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:       r.UpdatedAt.Format(time.RFC3339),
	}
}

func toProtoAnalytics(a *domain.UserAnalytics) *userpb.GetAnalyticsResponse {
	return &userpb.GetAnalyticsResponse{
		TotalUsers:          a.TotalUsers,
		NewUsersThisMonth:   a.NewUserThisMonth,
		TotalProviders:      a.TotalProviders,
		TotalCustomers:      a.TotalCustomers,
		PendingApplications: a.PendingApplications,
	}
}
