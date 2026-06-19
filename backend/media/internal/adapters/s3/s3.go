package s3

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/Rask1lll/masterhub/backend/media/internal/ports"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Adapter struct {
	client     *s3.Client
	bucket     string
	publicHost string // e.g. "https://masterhub-media.s3.ap-southeast-1.amazonaws.com"
}

func NewAdapter(endpoint, accessKey, secretKey, region, bucket, publicHost string) (*Adapter, error) {
	optFns := []func(*config.LoadOptions) error{
		config.WithRegion(region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		),
	}

	// endpoint задаётся только для локального MinIO
	// для настоящего S3 передаём пустую строку — тогда этот блок пропускается
	if endpoint != "" {
		optFns = append(optFns, config.WithEndpointResolverWithOptions(
			aws.EndpointResolverWithOptionsFunc(func(service, reg string, opts ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{
					URL:               endpoint,
					HostnameImmutable: true,
				}, nil
			}),
		))
	}

	cfg, err := config.LoadDefaultConfig(context.Background(), optFns...)
	if err != nil {
		return nil, fmt.Errorf("s3 config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		// нужно для MinIO — у него path-style URLs (localhost:9000/bucket/key)
		// для настоящего S3 это не мешает
		if endpoint != "" {
			o.UsePathStyle = true
		}
	})

	return &Adapter{
		client:     client,
		bucket:     bucket,
		publicHost: publicHost,
	}, nil
}

func (a *Adapter) Upload(ctx context.Context, file ports.File) (string, error) {
	_, err := a.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(a.bucket),
		Key:         aws.String(file.Key),
		Body:        file.Reader,
		ContentType: aws.String(file.ContentType),
	})
	if err != nil {
		return "", fmt.Errorf("s3 upload: %w", err)
	}

	url := fmt.Sprintf("%s/%s", a.publicHost, file.Key)
	return url, nil
}

func (a *Adapter) UploadMany(ctx context.Context, files []ports.File) ([]ports.UploadResult, error) {
	type result struct {
		index int
		res   ports.UploadResult
		err   error
	}

	ch := make(chan result, len(files))

	for i, f := range files {
		go func(i int, f ports.File) {
			url, err := a.Upload(ctx, f)
			ch <- result{index: i, res: ports.UploadResult{Key: f.Key, URL: url}, err: err}
		}(i, f)
	}

	results := make([]ports.UploadResult, len(files))
	var failed []string

	for range files {
		r := <-ch
		if r.err != nil {
			failed = append(failed, files[r.index].Key)
			continue
		}
		results[r.index] = r.res
	}

	if len(failed) > 0 {
		_ = a.DeleteMany(ctx, collectSucceeded(results))
		return nil, fmt.Errorf("upload failed for keys: %v", failed)
	}

	return results, nil
}

func (a *Adapter) GetOne(ctx context.Context, key string) (io.ReadCloser, error) {
	resp, err := a.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(a.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("s3 get object: %w", err)
	}
	return resp.Body, nil
}

func (a *Adapter) GetMany(ctx context.Context, keys []string) ([]io.ReadCloser, error) {
	type result struct {
		index int
		obj   io.ReadCloser
		err   error
	}
	ch := make(chan result, len(keys))

	for i, key := range keys {
		go func(i int, k string) {
			obj, err := a.GetOne(ctx, k)
			ch <- result{index: i, obj: obj, err: err}
		}(i, key)
	}

	results := make([]io.ReadCloser, len(keys))
	var failed []string

	for range keys {
		r := <-ch
		if r.err != nil {
			failed = append(failed, keys[r.index])
			continue
		}
		results[r.index] = r.obj
	}

	if len(failed) > 0 {
		return nil, fmt.Errorf("failed to get objects: %v", failed)
	}

	return results, nil
}

func (a *Adapter) Delete(ctx context.Context, key string) error {
	_, err := a.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(a.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("s3 delete: %w", err)
	}
	return nil
}

func (a *Adapter) DeleteMany(ctx context.Context, keys []string) error {
	type Result struct {
		index int
		err   error
	}

	ch := make(chan Result, len(keys))
	for i, key := range keys {
		go func(index int, k string) {
			err := a.Delete(ctx, k)
			ch <- Result{index: index, err: err}
		}(i, key)
	}

	var failed []string
	for range keys {
		r := <-ch
		if r.err != nil {
			failed = append(failed, keys[r.index])
		}
	}

	if len(failed) > 0 {
		return fmt.Errorf("failed to delete objects: %v", failed)
	}
	return nil
}

func collectSucceeded(results []ports.UploadResult) []string {
	var succeeded []string
	for _, r := range results {
		if r.URL != "" {
			succeeded = append(succeeded, r.Key)
		}
	}
	return succeeded
}

func (a *Adapter) GeneratePresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(a.client)

	req, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(a.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("s3 presign: %w", err)
	}

	return req.URL, nil
}
