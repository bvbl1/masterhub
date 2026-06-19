# MasterHub

A Kazakhstani online marketplace connecting customers with construction and home-service providers. Built on a microservices architecture using hexagonal (ports and adapters) design, with gRPC for inter-service communication and a gRPC-gateway exposing REST to the frontend.

**Live:** https://frontend-production-2d5c.up.railway.app/

---

## Overview

MasterHub is a full-stack web application that enables customers to discover, browse, and hire construction and home-service providers. The platform features real-time messaging, service reviews, notifications, and payment processing.

### Core Features

- **User Management:** Registration, authentication, and role management (customer/provider)
- **Service Listings:** Browse and manage construction/home-service offerings
- **Marketplace:** Filter services by category and location
- **Real-time Chat:** Direct messaging between customers and providers
- **Reviews & Ratings:** Customer feedback system for providers
- **Notifications:** In-app and email notifications for important events
- **Payment Processing:** Stripe integration for service payments

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                               │
│            https://frontend-production-2d5c.up.railway.app/         │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                REST Gateway (gRPC-Gateway)                          │
│                      localhost:8080                                 │
└──┬──────────────┬──────────────┬──────────────┬──────────────┬──────┘
   │              │              │              │              │
   ▼              ▼              ▼              ▼              ▼
┌────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐  ┌────────────┐
│ User   │  │Category │  │Service │  │ Location │  │ Notification│
│Service │  │ Service │  │Service │  │ Service  │  │  Service   │
│:50051  │  │ :50052  │  │ :50053 │  │ :50054   │  │   :50056   │
└────────┘  └─────────┘  └────────┘  └──────────┘  └────────────┘
   │              │              │              │
   │              │              ▼              │
   │              │        ┌──────────────┐     │
   │              └───────►│ PostgreSQL   │◄────┘
   │                       │   Database   │
   └──────────────────────►│              │◄─────────────────────┐
                           └──────────────┘                      │
                                                                 │
                    ┌────────────────────────────────────────────┤
                    │                                            │
                    ▼                                            ▼
            ┌──────────────────┐                        ┌──────────────┐
            │  Chat Service    │                        │  Review &    │
            │ WebSocket :8081  │                        │  Order       │
            │  gRPC :50055     │                        │  Services    │
            └──────────────────┘                        └──────────────┘
```

**Communication:**
- **Frontend → Backend:** REST API via gRPC-Gateway (HTTP/HTTPS)
- **Service-to-Service:** gRPC (protocol buffers)
- **Real-time Messaging:** WebSocket for chat
- **Database:** One PostgreSQL database with separate schemas per service

---

## Tech Stack

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) 16.2.6 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + PostCSS
- **State Management:** Zustand
- **Maps:** Google Maps API integration
- **Payment:** Stripe (React binding)
- **Internationalization:** i18next (multi-language support)
- **Animations:** Framer Motion
- **Icons:** React Icons

### Backend
- **Language:** Go (Golang)
- **RPC Framework:** gRPC + Protocol Buffers
- **REST Gateway:** gRPC-Gateway
- **Database:** PostgreSQL
- **ORM:** GORM
- **Authentication:** JWT
- **Email:** Gmail SMTP (notifications) \ Resend

### Infrastructure
- **Containerization:** Docker & Docker Compose (local)
- **Deployment:** Railway (production)
- **CI/CD:** GitHub Actions (assumed)

### Proto Files
- **Repository:** [github.com/bvbl1/masterhub-proto](https://github.com/bvbl1/masterhub-proto)
- Contains all `.proto` service definitions and auto-generated Go code

---

## Project Structure

```
masterhub/
├── frontend/                   # Next.js React application
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   ├── components/        # React components
│   │   ├── pages/             # API routes & pages
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   ├── next.config.ts         # Next.js configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   ├── tsconfig.json          # TypeScript config
│   └── package.json
│
├── backend/                    # Microservices (Go)
│   ├── user/                  # User service
│   │   ├── cmd/main.go
│   │   ├── internal/adapters/
│   │   │   ├── grpc/          # gRPC server
│   │   │   └── db/            # Database adapters
│   │   ├── internal/application/
│   │   │   └── core/          # Business logic
│   │   ├── internal/ports/    # Interfaces
│   │   ├── example.env
│   │   └── Dockerfile
│   │
│   ├── category/              # Category service
│   ├── service/               # Service listing service
│   ├── location/              # Location/address service
│   ├── chat/                  # Chat & messaging service
│   ├── notification/          # Notification service (email/in-app)
│   ├── order/                 # Order management service
│   ├── payment/               # Payment processing service
│   ├── review/                # Reviews & ratings service
│   │
│   └── gateway/               # gRPC-Gateway REST proxy
│
├── docker-compose.yml         # Local development orchestration
├── README.md                  # This file
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** installed
- **Node.js** (18+) for frontend development
- **Go** (1.20+) for backend development
- Optional: [PostgreSQL](https://www.postgresql.org/) (if running services locally)

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/bvbl1/masterhub.git
cd masterhub
```

#### 2. Configure Environment Variables

Each backend service has an `example.env` file. Copy and fill in values:

```bash
cp backend/user/example.env backend/user/.env
cp backend/category/example.env backend/category/.env
cp backend/service/example.env backend/service/.env
cp backend/location/example.env backend/location/.env
cp backend/chat/example.env backend/chat/.env
cp backend/notification/example.env backend/notification/.env
cp backend/order/example.env backend/order/.env
cp backend/payment/example.env backend/payment/.env
cp backend/review/example.env backend/review/.env
```

**Key environment variables:**
- `JWT_SECRET` — Secret key for JWT token signing
- `DATABASE_URL` — PostgreSQL connection string
- `SMTP_PASSWORD` — Gmail app password for sending emails
- `STRIPE_SECRET_KEY` — Stripe API key for payments

Defaults are pre-configured for the Docker Compose setup.

#### 3. Start the Project

```bash
# Start all services (backend, frontend, database, pgAdmin)
docker-compose up --build

# Run in background
docker-compose up --build -d

# Stop all services
docker-compose down
```

#### 4. Access the Application

Once running:

- **Frontend:** http://localhost:3000
- **REST API Gateway:** http://localhost:8080
- **Chat WebSocket:** ws://localhost:8081
- **pgAdmin:** http://localhost:5050
  - Email: `admin@masterhub.kz`
  - Password: `admin123`

---

## Services & Ports

| Service | Type | Description | Port(s) |
|---|---|---|---|
| **gateway** | Go | REST API proxy (gRPC-Gateway) | `8080` (REST) |
| **user** | Go | Registration, login, JWT, profiles | `50051` (gRPC) |
| **category** | Go | Service categories management | `50052` (gRPC) |
| **service** | Go | Service listings & browsing | `50053` (gRPC) |
| **location** | Go | Address & coordinates storage | `50054` (gRPC) |
| **chat** | Go | Real-time messaging | `50055` (gRPC), `8081` (WebSocket) |
| **notification** | Go | In-app & email notifications | `50056` (gRPC) |
| **order** | Go | Order management | (internal gRPC) |
| **payment** | Go | Payment processing (Stripe) | (internal gRPC) |
| **review** | Go | Reviews & ratings | (internal gRPC) |
| **frontend** | Next.js | Web application | `3000` (development) |
| **masterhub-db** | PostgreSQL | Main database | `5433` (exposed), `5432` (internal) |
| **pgAdmin** | Admin UI | Database management | `5050` |

---

## API Overview

### REST Endpoints (via Gateway: `http://localhost:8080`)

#### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/v1/user` | Register new account | No |
| POST | `/v1/auth/login` | Login, receive JWT | No |
| GET | `/v1/users/me` | Get authenticated user profile | Yes |
| PUT | `/v1/users/{user_id}` | Update user profile | Yes (self) |
| POST | `/v1/user/provider` | Promote self to provider | Yes |

#### Categories
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/v1/categories` | List all categories | No |
| GET | `/v1/categories/{id}` | Get category details | No |
| POST | `/v1/categories` | Create new category | Admin |
| PATCH | `/v1/categories/{id}` | Update category | Admin |
| DELETE | `/v1/categories/{id}` | Delete category | Admin |

#### Services (Listings)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/v1/services` | List services (filter: category_id, provider_id, location) | No |
| GET | `/v1/services/{id}` | Get service details | No |
| POST | `/v1/services` | Create service listing | Provider |
| PUT | `/v1/services/{id}` | Update service | Provider (owner) |
| DELETE | `/v1/services/{id}` | Delete service | Provider (owner) |

#### Locations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/v1/locations` | Create location (address + coordinates) | Optional |
| GET | `/v1/locations/{id}` | Get location by ID | No |

#### Chat
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/v1/conversations` | Start/get conversation with provider | Yes |
| GET | `/v1/conversations` | List user's conversations | Yes |
| GET | `/v1/conversations/{id}/messages` | Get message history | Yes |
| PATCH | `/v1/conversations/{id}/messages/read` | Mark messages as read | Yes |

**WebSocket (Real-time):** `ws://localhost:8081/ws?token=<JWT>`

Send message:
```json
{
  "type": "send_message",
  "conversation_id": 1,
  "recipient_id": 2,
  "content": "Hello!"
}
```

Receive message:
```json
{
  "type": "new_message",
  "message": {
    "id": 1,
    "conversation_id": 1,
    "sender_id": 3,
    "content": "Hello!",
    "is_read": false,
    "created_at": "2026-03-21T14:00:00Z"
  }
}
```

#### Reviews & Ratings
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/v1/reviews` | List reviews (filter: provider_id) | No |
| GET | `/v1/reviews/{id}` | Get review details | No |
| POST | `/v1/reviews` | Create review | Customer |
| PUT | `/v1/reviews/{id}` | Update review | Author (self) |
| DELETE | `/v1/reviews/{id}` | Delete review | Author (self) |

#### Notifications
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/v1/notifications` | List user notifications | Yes |
| PATCH | `/v1/notifications/{id}/read` | Mark notification as read | Yes |

#### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/v1/orders` | Create new order | Customer |
| GET | `/v1/orders/{id}` | Get order details | Customer/Provider |
| GET | `/v1/orders` | List orders (filter: status) | Yes |
| PATCH | `/v1/orders/{id}/status` | Update order status | Provider |

#### Payments (Stripe)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/v1/payments/intent` | Create payment intent | Customer |
| POST | `/v1/payments/webhook` | Stripe webhook handler | No (signature verified) |

---

## Database Schema

**Database Name:** `masterhub_db`  
**Host:** `masterhub-db:5432`

The database is shared across all services with separate schemas/tables for each domain:

- `users` — User accounts, roles, profiles
- `categories` — Service categories
- `services` — Service listings
- `locations` — Addresses & GPS coordinates
- `conversations` — Chat conversations
- `messages` — Chat messages
- `notifications` — User notifications
- `orders` — Service orders
- `payments` — Payment records
- `reviews` — Provider reviews & ratings

### Access pgAdmin

**URL:** http://localhost:5050

**Credentials:**
- Email: `admin@masterhub.kz`
- Password: `admin123`

**Server Configuration:**
- Host: `masterhub-db`
- Port: `5432`
- Database: `masterhub_db`
- Username: `postgres`
- Password: `postgres`

---

## Authentication & Security

### JWT Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Token Flow:**
1. User registers or logs in via `/v1/auth/login`
2. Server returns JWT token
3. Frontend stores token (localStorage/session)
4. Frontend sends token in all authenticated requests
5. Gateway validates token and forwards to services

### Hexagonal Architecture (Ports & Adapters)

Each backend service follows the hexagonal architecture pattern:

```
Service/
├── cmd/main.go                  # Entry point
├── internal/
│   ├── adapters/                # External integrations
│   │   ├── grpc/server.go       # gRPC server
│   │   ├── db/db.go            # Database adapter
│   │   └── ...
│   ├── application/
│   │   └── core/                # Business logic
│   │       ├── api/api.go       # Service API
│   │       └── domain/          # Domain models
│   └── ports/                   # Interfaces (contracts)
│       ├── api.go
│       └── db.go
```

This design allows:
- **Dependency Inversion:** Business logic depends on interfaces, not implementations
- **Testability:** Easy to mock adapters for unit testing
- **Flexibility:** Swap implementations without changing core logic

---

## Inter-Service Communication

### gRPC Communication

Services communicate via gRPC using Protocol Buffers. For example:

```go
// Service A calls Service B
client := category.NewCategoryServiceClient(conn)
response, err := client.GetCategory(ctx, &pb.GetCategoryRequest{Id: id})
```

All proto definitions are in the [masterhub-proto](https://github.com/bvbl1/masterhub-proto) repository.

### Service Discovery

- **Local Development:** Services connect via `service-name:port` (Docker DNS)
- **Production (Railway):** Defined in environment variables

---

## Email Notifications

The **Notification Service** sends emails via Gmail SMTP:

- Service events (order placed, review received)
- User communications (messages, promotions)
- Alerts (payment issues, account changes)

**Configuration:**
- `SMTP_HOST` — `smtp.gmail.com`
- `SMTP_PORT` — `587`
- `SMTP_USER` — Gmail address
- `SMTP_PASSWORD` — Gmail app password (not account password)

---

## Payment Processing

**Stripe Integration:**

- Customer initiates payment via frontend
- Frontend calls `/v1/payments/intent` to create Stripe intent
- Frontend completes payment on Stripe client
- Stripe webhook notifies backend (`/v1/payments/webhook`)
- Order status updated to "paid"

---

## Production Deployment

### Railway Deployment

The application is deployed on [Railway](https://railway.app/):

**Frontend:** https://frontend-production-2d5c.up.railway.app/

**Deployment Steps:**

1. Push to GitHub main branch
2. Railway detects new commits
3. Builds and deploys frontend (Next.js)
4. Backend services deployed separately
5. Database migrations run automatically

### Environment Variables (Production)

Set in Railway dashboard for each service:
- `DATABASE_URL` — Production PostgreSQL connection
- `JWT_SECRET` — Production JWT secret (strong, random)
- `NODE_ENV` — `production`
- `STRIPE_SECRET_KEY` — Production Stripe key
- `SMTP_PASSWORD` — Gmail app password
- `NEXT_PUBLIC_API_URL` — Production API gateway URL

---

## Proto Files & Code Generation

All gRPC service definitions and message types are in the [masterhub-proto](https://github.com/bvbl1/masterhub-proto) repository.

**Generated Code:**
- Go server stubs
- Go client code
- REST gateway routes
- TypeScript types (for frontend)

**To regenerate after proto changes:**

```bash
cd masterhub-proto
make generate  # Regenerates all Go code
```

Then pull latest changes in main repo and rebuild services.

---

## Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "feat: add new feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request to `main`

### Code Style

- **Go:** Follow [Effective Go](https://golang.org/doc/effective_go)
- **TypeScript/React:** Use ESLint config in `frontend/.eslintrc`
- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/)

---

## Troubleshooting

### Services Won't Start

```bash
# Clean up Docker
docker-compose down --volumes
docker-compose up --build

# Check logs
docker-compose logs -f [service-name]
```

### Database Connection Error

```bash
# Verify database is running
docker-compose ps masterhub-db

# Check PostgreSQL connection
docker-compose exec masterhub-db psql -U postgres -d masterhub_db
```

### JWT Token Expired

- Tokens expire after configured duration (typically 24 hours)
- User must log in again to get new token
- Set reasonable expiration in `.env`

### Email Notifications Not Sending

- Verify Gmail app password in `.env` (not account password)
- Check `Less Secure App Access` is enabled (if using 2FA)
- Review notification service logs: `docker-compose logs notification`

---

## Documentation

- **Proto Definitions:** [masterhub-proto](https://github.com/bvbl1/masterhub-proto)
- **Next.js Docs:** [nextjs.org](https://nextjs.org/)
- **Go gRPC:** [grpc.io/go](https://grpc.io/docs/languages/go/)
- **Hexagonal Architecture:** [Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)

---

## Authors

- **Moldakhmet Abylay Serikuly** — SE-2306
- **Nabiev Bekzat Armanovich** — SE-2306
- **Satpekov Rassul Erbulanovich** — SE-2306

**Supervisor:** Seraliyev Zhandos

**Institution:** AITU · 2026

---

## License

This project is proprietary. All rights reserved.

---

## Quick Links

- **Live Application:** https://frontend-production-2d5c.up.railway.app/
- **Proto Repository:** https://github.com/bvbl1/masterhub-proto
- **GitHub Repository:** https://github.com/Rask1lll/masterhub
- **Railway Dashboard:** https://railway.app/

---

**Last Updated:** 2026-06-07
