# Authentication Service

Central authentication service for multi-platform applications.

## Features

- User registration and login (email/password)
- JWT access and refresh tokens
- OAuth2 support (Google, GitHub, Microsoft(Microsoft is in Development, github and google works))
- Password reset with email(When a request for a password reset occurs, the reset link is logged to the console.)
- Multi-tenancy (multiple projects per user, a table per project is created in database, projects' table containing user informations in themselves)
- Request rate limiting for security
- Prisma ORM with PostgreSQL is used to store data

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL + Prisma
- JWT (jsonwebtoken)
- bcryptjs for password hashing
- Passport.js for OAuth

## API Endpoints

| Method | Endpoint              | Description            |
|--------|-----------------------|------------------------|
| POST   | /auth/register        | Register new user      |
| POST   | /auth/login           | Login user             |
| POST   | /auth/refresh         | Refresh access token   |
| POST   | /auth/logout          | Logout user            |
| GET    | /auth/verify          | Verify token           |
| POST   | /auth/forgot-password | Request password reset |
| POST   | /auth/reset-password  | Reset password         |
| POST   | /auth/projects        | Create new project     |
