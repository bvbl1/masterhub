package grpc

import (
	jobrequestpb "github.com/bvbl1/masterhub-proto/golang/job-request"
	notificationpb "github.com/bvbl1/masterhub-proto/golang/notification"
	userpb "github.com/bvbl1/masterhub-proto/golang/user"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Clients struct {
	User         userpb.UserServiceClient
	Notification notificationpb.NotificationServiceClient
	JobRequest   jobrequestpb.JobRequestServiceClient
}

func NewClients(userURL, notificationURL, jobRequestURL string) (*Clients, error) {
	userConn, err := grpc.NewClient(userURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	notifConn, err := grpc.NewClient(notificationURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	jrConn, err := grpc.NewClient(jobRequestURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	return &Clients{
		User:         userpb.NewUserServiceClient(userConn),
		Notification: notificationpb.NewNotificationServiceClient(notifConn),
		JobRequest:   jobrequestpb.NewJobRequestServiceClient(jrConn),
	}, nil
}
