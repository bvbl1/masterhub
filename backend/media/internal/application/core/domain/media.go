package domain

import "time"

const (
	ProviderDocuments = "provider_documents" //User (becoming provider)	Diploma, certificate, CV, ID scan
	ServicePhotos     = "service_photos"     //Provider creating service (work photos, portfolio images)
	ReviewPhotos      = "review_photos"      //cutomet leaving review (photos of work done, etc.)
	Avatar            = "avatar"             //pfp
	ChatMedia         = "chat_media"         //Images attached to chat messages
	OrderPhotos       = "order_photos"       //Customer order reference photos at creation
	JobRequestPhotos  = "job_request_photos" //Customer job request attachments
	DisputePhotos     = "dispute_photos"     //Dispute evidence photos on an order
)

type Media struct {
	Id         int64     `json:"id"`
	UploaderId int64     `json:"uploaded_id"` //extracted from jwt token, not from request body
	Context    string    `json:"context"`     //one of the constants above
	Url        string    `json:"url"`         //Full S3/CDN URL returned to caller
	Filename   string    `json:"filename"`    //Original filename, used for S3 key generation and logging
	SizeBytes  int64     `json:"size_bytes"`
	CreatedAt  time.Time `json:"created_at"`
}
