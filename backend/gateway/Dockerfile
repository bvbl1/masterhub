# backend/gateway/Dockerfile

FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o /gateway ./cmd/

# Final stage
FROM alpine:latest

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /gateway .

# Expose HTTP port
EXPOSE 8080

# Run the gateway
CMD ["./gateway"]