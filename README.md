# NeverEver Online Shop

A secure online shop for selling items to Burmese audiences in Myanmar.

## Features

- User authentication (signup/login with email/password or Google)
- Product catalog with images, sizes, colors
- Shopping cart and checkout
- Order management with Telegram notifications
- Admin panel for managing products and orders
- Manual payment via K-PAY/Wave with receipt upload

## Security

This application includes:
- HTTPS enforcement (required for production)
- JWT-based authentication
- Input validation and sanitization
- Rate limiting
- Security headers via Helmet
- Environment variables for secrets

## Setup

1. Install dependencies: `npm install`
2. Create a `.env` file with your secrets:
   ```
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ADMIN_PASSWORD=your_secure_admin_password
   JWT_SECRET=your_jwt_secret
   ```
3. Run the server: `npm start`

## Deployment

For production, deploy to a platform that provides HTTPS (e.g., Heroku, Vercel, AWS). Ensure the server is configured for HTTPS.

Update CORS origins in `index.js` to your domain.

## Usage

- Shop: Visit `/`
- Admin: Visit `/admin`

## Note

Payment is manual via K-PAY/Wave. For full e-commerce, integrate a payment gateway.