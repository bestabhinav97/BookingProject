# Project Booking API

This is a Node.js / Express hotel booking backend with JWT authentication, cookie-based sessions, room availability search, Stripe payment initiation, Stripe webhook verification, email confirmation, and admin dashboard endpoints.

## What is completed

- User signup and login using JWT tokens stored in HTTP-only cookies
- Room availability search with date validation using `dayjs`
- Global error handling middleware
- Booking initiation that creates a Stripe checkout session
- Stripe webhook endpoint to verify payment and confirm booking
- Email confirmation after Stripe payment succeeds
- Get user bookings
- Cancel user bookings
- Admin-only dashboard and bookings list endpoints

## Architecture and folders

- `app.js` - Main Express app, middleware, routers, webhook route, and server listener
- `controller/` - Request handlers for auth, rooms, bookings, and admin
- `routes/` - Route definitions for authentication, room search, bookings, and admin
- `middlewear/` - Authentication middleware and global error handler
- `model/` - Database access functions for users, bookings, and rooms
- `db/` - MySQL connection pool setup
- `utils/` - Helper utilities such as date validation and email sending

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root.

3. Add these environment variables:

```env
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_DB=your-database-name
JWT_SECRET=your-secret-key
STRIPE_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_KEY=your-stripe-webhook-secret
```

4. Start the server in development mode:

```bash
npm run dev
```

The app listens on `http://localhost:3000`.

## Important notes

- The Stripe webhook route is registered at `POST /webhook` and expects raw JSON payloads.
- The current email sender configuration uses Mailtrap credentials hardcoded in `utils/email.js`. Replace these with real SMTP credentials for production.
- The Stripe checkout session currently uses placeholder URLs:
  - `success_url: https://google.com`
  - `cancel_url: https://stripe.com`
    Update these to your frontend routes.
- Admin authorization is based on `req.user.role === "admin"` from the JWT payload.

## API Endpoints

### Auth

- `POST /auth/signUp`
  - Request body: `{ name, email, password }`
  - Registers a new user

- `POST /auth/login`
  - Request body: `{ email, password }`
  - Returns a JWT cookie named `token`

### Rooms

- `POST /room/getAvailableRoom`
  - Requires authentication
  - Request body: `{ fromDate, toDate, noOfBedsRequired }`
  - Returns available rooms for the requested dates

### Bookings

All bookings routes require authentication.

- `POST /bookings/initiate`
  - Request body: `{ roomNumber, fromDate, toDate }`
  - Validates date range and availability, creates a pending booking, and returns a Stripe checkout URL

- `GET /bookings/getBookings`
  - Returns bookings for the logged-in user

- `GET /bookings/cancelBooking/:bookingId`
  - Cancels the specified booking for the logged-in user

### Webhook

- `POST /webhook`
  - Stripe webhook endpoint
  - Verifies the event using `STRIPE_WEBHOOK_KEY`
  - Confirms booking status and sends email on `checkout.session.completed`

### Admin

Requires authenticated user with `role: "admin"` in the JWT payload.

- `GET /admin/adminDashboard`
  - Returns booking summary data for dashboard display

- `GET /admin/adminDashboard/getAllBookings`
  - Returns all bookings for admin management

## Database

The project uses MySQL via `mysql2/promise`.

Expected database tables include at least:

- `user` with fields such as `userId`, `name`, `email`, `password`, `role`
- `bookings` with fields such as `bookingId`, `userId`, `roomNumber`, `status`, `fromDate`, `toDate`, `totalCost`, `createdAt`
- `room` with fields used by room availability logic, including `pricePerNight`

## Recommended improvements

- Move Mailtrap credentials to environment variables
- Add logout route and client-side cookie clearing
- Update Stripe success and cancel URLs to real frontend pages
- Add admin room create/edit/delete routes and user management
- Add request validation and rate limiting for production

## Running notes

- The app currently uses `express.json()` globally, except for `/webhook` which uses `express.raw()` to verify Stripe signatures correctly.
- Authentication relies on the `token` cookie; make sure your client sends cookies with requests.
- Use `dayjs` and helper validation to ensure valid booking date inputs.
