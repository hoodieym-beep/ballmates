# Ball Mates API

Backend for the Ball Mates football meetup app. Node.js, Express, MongoDB.

## Setup

1. Copy `.env.example` to `.env`. Set MONGODB_URI, JWT_SECRET, CLOUDINARY_*, PORT.
2. Run: npm install && npm run dev

## Main routes

- POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- GET/POST/PUT/DELETE /api/sessions, POST /api/sessions/:id/join, POST /api/sessions/:id/leave
- GET/POST /api/messages/sessions/:id/messages, GET/POST /api/messages/private
- POST /api/upload/avatar, POST/GET /api/sessions/:id/motm, POST /api/reports
- POST /api/reminders/sessions/:id/remind, GET /api/reminders/me
