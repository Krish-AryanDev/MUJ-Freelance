# MUJ Freelance

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)

## Overview

MUJ Freelance is a full-stack freelance marketplace platform for MUJ students. It connects clients and freelancers through gigs and projects, with real-time messaging, orders, payments, reviews, notifications, and role-based dashboards.

## Features

- [x] Authentication with OTP verification and JWT sessions
- [x] Client and freelancer role-based access control
- [x] Gigs marketplace with filters and detailed gig pages
- [x] Project posting and proposal workflows
- [x] Order lifecycle management (active, delivered, revision, completed)
- [x] Real-time messaging via Socket.IO
- [x] Reviews and ratings system
- [x] Notifications with unread count and actions
- [x] Search and marketplace discovery
- [x] Admin dashboard for platform moderation and analytics
- [x] Mock payment flow with platform fee support

## Tech Stack

### Frontend

| Layer | Technology |
| --- | --- |
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Server State | TanStack React Query |
| Networking | Axios |
| Forms & Validation | React Hook Form + Zod |
| Realtime | Socket.IO Client |

### Backend

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + HttpOnly cookies |
| Security | Helmet, CORS, rate limiting |
| File/Media | Cloudinary |
| Email | Nodemailer (SMTP) |
| Realtime | Socket.IO |

## Project Structure

```text
MUJ-freelance-model/
|-- client/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- services/
|   |-- store/
|   |-- types/
|   |-- utils/
|   `-- package.json
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- utils/
|   `-- package.json
|-- package.json
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Gmail account (for SMTP)

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd Muj-freelance-model
```

2. Install root dependencies

```bash
npm install
```

3. Install client dependencies

```bash
cd client
npm install
cd ..
```

4. Install server dependencies

```bash
cd server
npm install
cd ..
```

5. Setup environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

6. Run development servers

```bash
npm run dev
```

## Environment Variables

| Variable | App | Description |
| --- | --- | --- |
| PORT | server | Backend server port |
| NODE_ENV | server | Environment mode |
| MONGO_URI | server | MongoDB Atlas connection string |
| ACCESS_TOKEN_SECRET | server | JWT access token secret |
| REFRESH_TOKEN_SECRET | server | JWT refresh token secret |
| ACCESS_TOKEN_EXPIRY | server | Access token duration |
| REFRESH_TOKEN_EXPIRY | server | Refresh token duration |
| CLIENT_URL | server | Frontend origin for CORS/socket |
| CLOUDINARY_CLOUD_NAME | server | Cloudinary cloud name |
| CLOUDINARY_API_KEY | server | Cloudinary API key |
| CLOUDINARY_API_SECRET | server | Cloudinary API secret |
| SMTP_HOST | server | SMTP provider host |
| SMTP_PORT | server | SMTP provider port |
| SMTP_USER | server | SMTP username/email |
| SMTP_PASS | server | SMTP password/app password |
| RAZORPAY_KEY_ID | server/client | Razorpay public key |
| RAZORPAY_KEY_SECRET | server | Razorpay secret key |
| PLATFORM_FEE_PERCENT | server | Platform commission percentage |
| NEXT_PUBLIC_API_URL | client | Base API URL for frontend |
| NEXT_PUBLIC_SOCKET_URL | client | Socket server URL |
| NEXT_PUBLIC_APP_NAME | client | Public app name |
| NEXT_PUBLIC_APP_URL | client | Public app URL |

## Available Scripts

| Command | Description |
| --- | --- |
| npm run dev | Runs both frontend and backend |
| npm run client | Runs only frontend |
| npm run server | Runs only backend |
| npm run build | Builds frontend for production |
| npm run start:client | Starts frontend production server |
| npm run start:server | Starts backend production server |

## API Documentation

| Feature | Endpoints |
| --- | --- |
| Auth | /api/auth/register, /api/auth/login, /api/auth/refresh, /api/auth/logout, /api/auth/me, /api/auth/send-otp, /api/auth/verify-otp |
| Users | /api/users/me, /api/users/:id |
| Gigs | /api/gigs, /api/gigs/:id, /api/gigs/me/list |
| Projects | /api/projects, /api/projects/my, /api/projects/:id, /api/projects/:id/proposals |
| Orders | /api/orders, /api/orders/:id, /api/orders/:id/deliver, /api/orders/:id/accept |
| Messages | /api/messages/conversations, /api/messages/conversations/:id/messages |
| Reviews | /api/reviews, /api/reviews/me, /api/reviews/user/:userId |
| Notifications | /api/notifications, /api/notifications/unread-count, /api/notifications/mark-all-read |
| Payments | /api/payments/create-order, /api/payments/verify, /api/payments/history |
| Admin | /api/admin/dashboard-stats, /api/admin/users, /api/admin/gigs, /api/admin/orders, /api/admin/analytics |

## Contributing

1. Fork the repository and create a feature branch.
2. Keep code style consistent with the existing TypeScript and Tailwind patterns.
3. Add or update tests where relevant.
4. Open a pull request with a clear summary of changes.

## License

MIT

