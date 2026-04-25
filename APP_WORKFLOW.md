# MUJ Freelance - Complete App Workflow

Last updated: 2026-04-25

## 1) System Overview

MUJ Freelance is a full-stack marketplace for MUJ students with these major parts:

- Client app: Next.js 14 (App Router) + TypeScript + Tailwind
- Server API: Express + Mongoose + JWT auth + Socket.IO
- Storage/services: MongoDB, Redis cache, Cloudinary, SMTP

Runtime defaults:

- Client: http://localhost:3000
- API: http://localhost:5000
- API base path: /api

---

## 2) Boot and Runtime Flow

### 2.1 Start the app

1. Run npm run dev at repository root.
2. Root script starts both:
   - client dev server
   - server dev server
3. Server loads environment from server/.env, starts middleware, connects DB/Redis, then mounts routes.

### 2.2 Incoming request flow (server)

1. CORS and security middleware run (helmet, rate limit, cookie parser, etc.).
2. For /api/* routes, a DB readiness guard checks Mongo connection.
3. Route-level middleware runs:
   - requireAuth for protected routes
   - requireRole/requireAdmin for role checks
4. Controller logic executes.
5. Standard API response format is returned.

---

## 3) Authentication and Session Workflow

### 3.1 Registration

1. User submits name, MUJ email, password.
2. POST /api/auth/register validates inputs.
3. Server creates user with defaults:
   - roles: [client, freelancer]
   - isEmailVerified: false
   - accountStatus: pending_verification
4. Server issues access + refresh JWT.
5. Tokens are set as HttpOnly cookies and also returned in response payload.

### 3.2 Email OTP verification

1. POST /api/auth/send-verification-otp sends OTP to MUJ email.
2. POST /api/auth/verify-email-otp verifies OTP.
3. On success, user is updated:
   - isEmailVerified: true
   - accountStatus: active

### 3.3 Login / logout / refresh

1. POST /api/auth/login authenticates user and rotates tokens.
2. GET /api/auth/me returns current user (protected).
3. POST /api/auth/refresh-token rotates and re-issues cookies.
4. POST /api/auth/logout clears refresh token in DB and clears auth cookies.

### 3.4 Client-side auth bootstrap

1. useAuth triggers authStore.initializeAuth on app load.
2. If localStorage session hint exists, client calls /auth/me.
3. If /auth/me fails with unauthorized, store clears auth state.
4. Axios interceptor can refresh token for normal 401s, but startup /auth/me is treated as session probe and not auto-refreshed there.

---

## 4) Authorization and Roles

Supported roles:

- client
- freelancer
- admin

Patterns:

- requireAuth: user must be authenticated
- requireRole(client|freelancer): role-gated business actions
- requireAdmin: admin-only dashboard/moderation actions

---

## 5) Marketplace Domain Workflow

There are two parallel business tracks in this codebase:

- Project + Proposal track (custom client projects)
- Gig + Order track (package-tier purchases)

### 5.1 Project + Proposal track

#### Client project lifecycle

1. Client creates project: POST /api/projects
2. Project enters open status.
3. Clients can update/delete only while open.
4. Clients can list own projects at GET /api/projects/my.

#### Freelancer proposal lifecycle

1. Freelancer submits proposal: POST /api/projects/:id/proposals
2. Constraints:
   - cannot propose to own project
   - project must be open
   - one proposal per freelancer per project
3. Client receives new_proposal notification.

#### Proposal decision lifecycle

1. Client views proposals: GET /api/projects/:id/proposals
2. Client accepts one: PUT /api/projects/:id/proposals/:proposalId/accept
3. Effects of acceptance:
   - selected proposal -> accepted
   - remaining pending proposals -> rejected
   - project moves to in-progress and freelancer is assigned
   - accepted freelancer gets proposal_accepted notification
   - others get proposal_rejected notification
4. Client can close project: PUT /api/projects/:id/close (status -> cancelled)

Note: Project status values include both in_progress (schema enum) and in-progress (used by controller logic for compatibility in queries).

### 5.2 Gig + Order track

#### Order creation

1. Client places order: POST /api/orders with gigId + packageTier.
2. Server verifies package tier and prevents self-ordering.
3. If an active in-progress order already exists for same client+gig, existing order is returned.
4. New orders start in active status.
5. Freelancer receives order_placed notification.

#### Order execution and transitions

Primary transitions:

- active -> delivered (freelancer delivers)
- delivered -> revision (client requests revision)
- revision -> delivered (freelancer re-delivers)
- delivered -> completed (client accepts)
- active -> cancelled (client cancels)
- active or delivered -> disputed (either party raises dispute)
- disputed -> resolved (admin resolves)

Endpoints:

- PUT /api/orders/:id/deliver
- PUT /api/orders/:id/revision
- PUT /api/orders/:id/accept
- PUT /api/orders/:id/cancel
- POST /api/orders/:id/dispute

---

## 6) Payment Workflow (Mock in current code)

Current payment module is explicitly mock/simulated, not production gateway integrated.

Flow:

1. Initiate payment: POST /api/payments/initiate with orderId
   - creates/updates payment as pending
   - computes commission and freelancerAmount
2. Confirm payment: POST /api/payments/confirm with paymentId and action
   - success -> completed
   - failure -> failed
3. On order acceptance (client accepts delivery):
   - system attempts releasePaymentForOrder(orderId)
   - completed payment -> released
   - freelancer totalEarnings/completedOrders updated
4. On order cancel:
   - system attempts refundPaymentForOrder(orderId)
   - completed payment -> refunded

Read APIs:

- GET /api/payments/history
- GET /api/payments/earnings

---

## 7) Messaging Workflow (REST + Socket.IO)

### 7.1 Conversation lifecycle

1. List conversations: GET /api/messages/conversations
2. Open/create one: POST /api/messages/conversations
   - supports direct, order-related, gig-related context

### 7.2 Message lifecycle

1. Fetch messages: GET /api/messages/conversations/:id
   - auto-marks unread incoming messages as read for requester
2. Send message: POST /api/messages/conversations/:id
   - supports text/image/file/order_update
   - updates conversation last message metadata
3. Mark conversation read: PUT /api/messages/conversations/:id/read
4. Get unread count: GET /api/messages/unread-count
5. Delete own message: DELETE /api/messages/:messageId
   - implemented as soft-delete content replacement

### 7.3 Realtime events

Socket server authenticates with access token and then supports:

- register_user
- join_conversation / leave_conversation
- typing_start / typing_stop
- send_message -> new_message broadcast
- mark_read -> message_read broadcast

Server also emits:

- new_message
- conversation_updated
- active_users

---

## 8) Notification Workflow

### 8.1 Creation

Notifications are created from business events, including:

- proposal submission/accept/reject
- order placed/delivered/completed/cancelled
- review submission

### 8.2 Delivery and management

1. Stored in notifications collection.
2. Pushed in realtime via Socket.IO event new_notification.
3. User actions:
   - GET /api/notifications
   - GET /api/notifications/unread-count
   - PUT /api/notifications/:notificationId/read
   - PUT /api/notifications/mark-all-read
   - DELETE /api/notifications/:notificationId
   - DELETE /api/notifications/read

---

## 9) Review Workflow

Rules:

1. Reviews allowed only for completed orders.
2. Two directed review types are supported:
   - client_to_freelancer
   - freelancer_to_client
3. One review per order per type.
4. Reviewer must be party of the order and match type permissions.

Effects:

- New review notification sent to reviewee.
- Client->freelancer reviews trigger rating recalculation for:
  - Gig
  - FreelancerProfile

Endpoints:

- POST /api/reviews
- GET /api/reviews/gig/:gigId
- GET /api/reviews/user/:userId
- GET /api/reviews/order/:orderId
- GET /api/reviews/my-reviews
- PUT /api/reviews/:reviewId
- DELETE /api/reviews/:reviewId

---

## 10) Profile Workflow

### Public

- GET /api/profile/search
- GET /api/profile/user/:userId
- GET /api/profile/:profileUrl

### Authenticated self-profile

- GET /api/profile/me
- GET /api/profile/me/completion
- PUT /api/profile/me/basic
- PUT /api/profile/me/about
- PUT /api/profile/me/skills
- PUT /api/profile/me/social
- PUT /api/profile/me/settings
- PUT /api/profile/me/muj
- POST /api/profile/me/avatar
- POST /api/profile/me/cover

Plus CRUD for education, experience, portfolio, certifications, and languages.

---

## 11) Admin Workflow

All admin routes require authenticated admin role.

Capabilities:

1. Dashboard stats and revenue trends
2. User moderation
   - list users
   - ban user
   - unban user
3. Order operations
   - list orders
   - list disputes
   - resolve dispute (status -> resolved with admin note)
4. Analytics
   - monthly revenue
   - users by role
   - orders by status

Endpoints are under /api/admin.

---

## 12) Frontend Route Journey Map (High Level)

### Public/auth routes

- / (landing)
- /projects, /projects/:id
- /freelancers
- /search
- /login, /register, /forgot-password, /verify-email

### Logged-in user routes

- /messages and /messages/:conversationId
- /orders/:id
- /profile/setup and /profile/:id

### Client dashboard routes

- /dashboard/client
- /dashboard/client/projects
- /dashboard/client/projects/edit/:id
- /dashboard/client/orders
- /dashboard/client/payments

### Freelancer dashboard routes

- /dashboard/freelancer
- /dashboard/freelancer/proposals
- /dashboard/freelancer/orders
- /dashboard/freelancer/earnings

### Admin routes

- /admin
- /admin/users
- /admin/orders
- /admin/disputes
- /admin/analytics
- /admin/withdrawals

---

## 13) End-to-End Sequences

### 13.1 Register and verify

1. User registers -> tokens issued -> session cookie set.
2. User requests OTP and verifies email.
3. User becomes active and can continue protected flows.

### 13.2 Client project hiring flow

1. Client creates project.
2. Freelancers submit proposals.
3. Client accepts one proposal.
4. System assigns freelancer and notifies all impacted freelancers.

### 13.3 Order completion and payout flow

1. Client places order on gig tier.
2. Freelancer delivers.
3. Client accepts delivery.
4. Order becomes completed.
5. Payment release is attempted and freelancer earnings update.

---

## 14) Quick API Surface by Module

- Auth: /api/auth/*
- Users: /api/users/*
- Profile: /api/profile/*
- Projects/proposals: /api/projects/*
- Orders: /api/orders/*
- Payments (mock): /api/payments/*
- Messages: /api/messages/*
- Notifications: /api/notifications/*
- Reviews: /api/reviews/*
- Admin: /api/admin/*

---

## 15) Current Implementation Notes

1. Payments are mock and must be replaced with real gateway/webhooks before production.
2. Socket auth expects a valid access token in handshake payload/query.
3. Auth bootstrap currently depends on local session hint and may clear state if /auth/me fails.
4. Project status naming has mixed compatibility handling for in_progress vs in-progress.
