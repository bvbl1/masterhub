# backend/category/Dockerfile

FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /category-service ./cmd/main.go

FROM alpine:latest

WORKDIR /root/

COPY --from=builder /category-service .

EXPOSE 50052

CMD ["./category-service"]