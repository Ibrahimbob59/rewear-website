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
│   ├── Header.tsx      # Navigation header
│   ├── Footer.tsx      # Site footer
│   ├── ItemCard.tsx    # Product card component
│   └── ThemeProvider.tsx # Dark/light mode provider
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── CartContext.tsx # Shopping cart (localStorage)
│   └── FavoritesContext.tsx # Favorites (API-based)
├── pages/              # Page components
│   ├── Home.tsx        # Items listing with filters
│   ├── ItemDetails.tsx # Single item view
│   ├── Login.tsx       # Authentication
│   ├── Cart.tsx        # Shopping cart
│   ├── Checkout.tsx    # Order placement
│   └── ...
└── services/           # API services
    ├── axiosClient.ts  # Axios instance with auth
    └── api.ts          # API endpoints
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

## Recent Changes
- Initial build of ReWear marketplace
- All core features implemented: browsing, auth, cart, checkout, orders, favorites, sell/donate items, driver application
