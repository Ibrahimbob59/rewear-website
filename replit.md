# ReWear - Sustainable Fashion Marketplace

## Overview
ReWear is a sustainable fashion marketplace where users can buy, sell, and donate pre-loved clothing. Built as a graduation project, it focuses on circular economy, reducing textile waste, and ethical consumption.

## Project Architecture
- **Frontend**: React + Vite + TypeScript with TailwindCSS and shadcn/ui
- **State Management**: React Context (Auth, Cart, Favorites) + TanStack Query
- **Routing**: Wouter
- **API Client**: Axios with JWT interceptors
- **Backend**: External Laravel API (not included in this repo)

## Key Directories
```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Navigation header with search, user avatar
│   ├── Footer.tsx      # Site footer
│   ├── ItemCard.tsx    # Product card component
│   ├── ProtectedRoute.tsx # Auth guard component
│   └── ThemeProvider.tsx # Dark/light mode provider
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # JWT authentication state with refresh tokens
│   ├── CartContext.tsx # Shopping cart (localStorage)
│   └── FavoritesContext.tsx # Favorites (API-based)
├── pages/              # Page components
│   ├── Home.tsx        # Items listing with filters
│   ├── ItemDetails.tsx # Single item view
│   ├── Login.tsx       # Authentication
│   ├── Register.tsx    # 2-step OTP registration
│   ├── Cart.tsx        # Shopping cart
│   ├── Checkout.tsx    # Order placement
│   ├── Sell.tsx        # List items for sale/donation
│   ├── ApplyDriver.tsx # Driver application form
│   └── ...
└── services/           # API services
    ├── axiosClient.ts  # Axios instance with JWT refresh logic
    └── api.ts          # API endpoints for Laravel backend
```

## Environment Variables
- `VITE_API_BASE_URL`: Laravel backend URL (default: http://127.0.0.1:8000)

## Running the Project
```bash
npm run dev
```

## Design System
- Primary: Deep forest green (hsl 145 65% 28%)
- Secondary: Beige/off-white
- Accent: Soft brown
- Font: Inter
- Dark mode supported via ThemeProvider

## Backend API Structure
The Laravel backend follows RESTful conventions with JWT authentication:
- All responses use `{success: boolean, data: {...}, message: string}` envelope
- Authentication: JWT with access_token (short-lived) + refresh_token (long-lived)
- Registration: 2-step flow - POST /api/auth/register-code then POST /api/auth/register with verification_code

### Key Endpoints
- `POST /api/auth/register-code` - Request verification code
- `POST /api/auth/register` - Complete registration with code
- `POST /api/auth/login` - Login (returns access_token, refresh_token, user)
- `POST /api/auth/refresh-token` - Refresh expired access token
- `GET /api/auth/me` - Get current user profile
- `GET /api/items` - List items with optional filters
- `POST /api/items` - Create new item (multipart/form-data with image)
- `GET/POST/DELETE /api/favorites/{itemId}` - Manage favorites
- `POST /api/orders` - Create order
- `POST /api/driver-applications` - Apply as driver

## Recent Changes
- Updated JWT authentication with access_token + refresh_token storage
- Implemented 2-step OTP registration (request code → verify & register)
- Updated all API endpoints to match Laravel backend structure
- Fixed response parsing for Laravel's `{success, data}` envelope format
- Updated Header to show user avatar with initials and full name
- Updated Sell and ApplyDriver pages with authentication guards
- Used hardcoded categories as fallback (Women's, Men's, Kids, Accessories, Shoes)
- Simplified App.tsx routing with ProtectedRoute component wrapper

## Notes
- Network errors expected if Laravel backend not running locally
- Items list may be empty if backend has no seed data
- Some pages (Sell, ApplyDriver) handle auth checks internally
