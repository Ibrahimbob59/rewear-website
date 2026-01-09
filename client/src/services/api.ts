import axiosClient from './axiosClient';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  category_id: number;
  category?: Category;
  user_id: number;
  user?: User;
  status: 'available' | 'sold' | 'pending';
  condition: string;
  size?: string;
  brand?: string;
  is_donation: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  item_id: number;
  item: Item;
  quantity: number;
  price: number;
}

export interface Favorite {
  id: number;
  item_id: number;
  item: Item;
  user_id: number;
}

export interface CartItem {
  item: Item;
  quantity: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ItemFilters {
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  size?: string;
  sort?: string;
}

const api = {
  auth: {
    register: (data: RegisterData) => axiosClient.post('/api/auth/register', data),
    login: (data: LoginData) => axiosClient.post('/api/auth/login', data),
    logout: () => axiosClient.post('/api/auth/logout'),
    me: () => axiosClient.get('/api/auth/me'),
    verifyOtp: (data: { email: string; otp: string }) => axiosClient.post('/api/auth/verify-otp', data),
    refresh: () => axiosClient.post('/api/auth/refresh'),
  },

  items: {
    getAll: (filters?: ItemFilters) => axiosClient.get('/api/items', { params: filters }),
    getById: (id: number) => axiosClient.get(`/api/items/${id}`),
    create: (data: FormData) => axiosClient.post('/api/items', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id: number, data: FormData) => axiosClient.post(`/api/items/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id: number) => axiosClient.delete(`/api/items/${id}`),
    getMyItems: () => axiosClient.get('/api/my-items'),
  },

  categories: {
    getAll: () => axiosClient.get('/api/categories'),
  },

  orders: {
    create: (data: { items: { item_id: number; quantity: number }[]; shipping_address: string }) =>
      axiosClient.post('/api/orders', data),
    getAll: () => axiosClient.get('/api/orders'),
    getById: (id: number) => axiosClient.get(`/api/orders/${id}`),
  },

  favorites: {
    add: (item_id: number) => axiosClient.post('/api/favorites', { item_id }),
    getAll: () => axiosClient.get('/api/favorites'),
    remove: (id: number) => axiosClient.delete(`/api/favorites/${id}`),
  },

  driver: {
    apply: (data: FormData) => axiosClient.post('/api/driver/apply', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  },

  profile: {
    update: (data: Partial<User>) => axiosClient.put('/api/users/me', data),
  },
};

export default api;
