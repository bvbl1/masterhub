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

func GetApplicationPOrt() int {
	portStr := getEnviromentValue("APPLICATION_PORT")
	port, err := strconv.Atoi(portStr)

	if err != nil {
		log.Fatalf("port: %s is invalid", portStr)
	}

	return port
}

// JWT
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

func getEnviromentValue(key string) string {
	if os.Getenv(key) == "" {
		log.Fatalf("%s environment variable is missing.", key)
	}
	return os.Getenv(key)
}

//smtp are unused for now, since railway doesn't support smtp with hobby plan, but we can easily switch to it in the future if needed
// func GetSMTPHost() string {
// 	return getEnviromentValue("SMTP_HOST")
// }

// func GetSMTPPort() int {
// 	portStr := getEnviromentValue("SMTP_PORT")
// 	port, err := strconv.Atoi(portStr)

// 	if err != nil {
// 		log.Fatalf("SMTP_PORT: %s is invalid", portStr)
// 	}

// 	return port
// }

// func GetSMTPUsername() string {
// 	return getEnviromentValue("SMTP_USERNAME")
// }

// func GetSMTPPassword() string {
// 	return getEnviromentValue("SMTP_PASSWORD")
// }

// resend
func GetResendAPIKey() string {
	return getEnviromentValue("RESEND_API_KEY")
}

func GetEmailFrom() string {
	return getEnviromentValue("EMAIL_FROM")
}

func GetSMTPFrom() string {
	return getEnviromentValue("SMTP_FROM")
}

func GetTelegramBotToken() string {
	return getEnviromentValue("TELEGRAM_BOT_TOKEN")
}
