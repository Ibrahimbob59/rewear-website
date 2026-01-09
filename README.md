# ReWear - Sustainable Fashion Marketplace

A professional, production-quality sustainable fashion marketplace built with React and Vite. ReWear enables users to buy, sell, and donate pre-loved clothing, promoting circular economy and reducing textile waste.

## Features

- **Public Browsing**: Browse items, search, filter, and view item details without login
- **User Authentication**: Register, login, and manage your profile
- **Shopping**: Add items to cart and checkout
- **Selling/Donating**: List items for sale or as donations
- **Favorites**: Save items you love for later
- **Order Management**: Track your orders
- **Driver Application**: Apply to become a delivery driver

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: TailwindCSS with shadcn/ui components
- **Routing**: Wouter
- **State Management**: React Context + TanStack Query
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `VITE_API_BASE_URL` to point to your Laravel backend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

### Backend Requirements

This frontend connects to a Laravel REST API. To run the backend:

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── App.tsx         # Main app component
├── public/             # Static assets
└── index.html          # Entry HTML
```

## API Endpoints

The frontend expects the following API endpoints:

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Items
- `GET /api/items` - List all items (with filters)
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/my-items` - Get user's items

### Categories
- `GET /api/categories`

### Orders
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

### Favorites
- `POST /api/favorites`
- `GET /api/favorites`
- `DELETE /api/favorites/:id`

### Driver
- `POST /api/driver/apply`

### Profile
- `PUT /api/users/me`

## License

This project is created as a graduation project for educational purposes.
