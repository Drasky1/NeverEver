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

## Deployment on Render

1. Push your code to GitHub.
2. Create a new Web Service on Render, connect your GitHub repo.
3. Set the following Environment Variables in Render's dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
   - `TELEGRAM_CHAT_ID`: Your Telegram chat ID
   - `ADMIN_PASSWORD`: A secure password for admin access
   - `JWT_SECRET`: A random string for JWT signing (e.g., generate with `openssl rand -base64 32`)
4. Set Build Command: `npm install`
5. Set Start Command: `node index.js`
6. Deploy!

Render provides automatic HTTPS, so no additional SSL setup needed.

## Usage

- Shop: Visit `/`
- Admin: Visit `/admin`

## Note

Payment is manual via K-PAY/Wave. For full e-commerce, integrate a payment gateway.