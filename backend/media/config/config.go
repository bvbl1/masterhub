package config

import (
	"log"
	"os"
	"strconv"
	"time"
)

func GetEnv() string {
	return getEnviromentValue("ENV")
}

func GetDataSourceUrl() string {
	return getEnviromentValue("DATA_SOURCE_URL")
}

func GetApplicationPort() int {
	portStr := getEnviromentValue("APPLICATION_PORT")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		log.Fatalf("port: %s is invalid", portStr)
	}
	return port
}

func GetJWTSecret() string {
	return getEnviromentValue("JWT_SECRET")
}

func GetJWTExpiration() time.Duration {
	expStr := getEnviromentValue("JWT_EXPIRATION")
	exp, err := time.ParseDuration(expStr)
	if err != nil {
		log.Fatalf("JWT_EXPIRATION: %s is invalid", expStr)
	}
	return exp
}

// S3 (AWS или локальный MinIO)
type S3Config struct {
	Endpoint   string // пусто = настоящий AWS S3; "http://localhost:9000" = MinIO
	AccessKey  string
	SecretKey  string
	Region     string
	Bucket     string
	PublicHost string // базовый URL для построения публичных ссылок
}

func GetS3Config() S3Config {
	return S3Config{
		Endpoint:   os.Getenv("S3_ENDPOINT"), // не fatal — может быть пустым для AWS
		AccessKey:  getEnviromentValue("S3_ACCESS_KEY"),
		SecretKey:  getEnviromentValue("S3_SECRET_KEY"),
		Region:     getEnviromentValue("S3_REGION"),
		Bucket:     getEnviromentValue("S3_BUCKET"),
		PublicHost: getEnviromentValue("S3_PUBLIC_HOST"),
	}
}

func getEnviromentValue(key string) string {
	if os.Getenv(key) == "" {
		log.Fatalf("%s environment variable is missing.", key)
	}
	return os.Getenv(key)
}
