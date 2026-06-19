FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o payment-service ./cmd

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/payment-service .
# main.go reads PORT (default 8080); compose maps 50058:50058
ENV PORT=50058
EXPOSE 50058
CMD ["./payment-service"]