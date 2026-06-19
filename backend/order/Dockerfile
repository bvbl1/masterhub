# backend/order/Dockerfile

FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /order-service ./cmd/main.go

# Final stage
FROM alpine:latest

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /order-service .

# Expose gRPC port
EXPOSE 50057

# Run the service
CMD ["./order-service"]