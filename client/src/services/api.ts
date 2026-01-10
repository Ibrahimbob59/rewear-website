import axiosClient from './axiosClient';

export interface User {
  id: number;
  full_name: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role?: string;
  email_verified_at?: string;
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
  seller?: User;
  status: 'available' | 'sold' | 'pending';
  condition: string;
  size?: string;
  brand?: string;
  is_donation: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: number;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: number;
  user_id: number;
  items?: any[];
  total?: number;
  total_amount?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  delivery_address?: Address;
  created_at: string;
  updated_at: string;
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

export interface RegisterCodeData {
  email: string;
}

/**
 * ✅ KEEP UI SHAPE (your current frontend)
 */
export interface RegisterData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  verification_code: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

export interface ItemFilters {
  category_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  size?: string;
  sort?: string;
  status?: string;
}

export interface DriverApplicationData {
  vehicle_type: string;
  license_number: string;
  vehicle_plate: string;
  experience_years: number;
  coverage_areas: string[];
  phone: string;
  notes?: string;
}

const api = {
  auth: {
    requestCode: (data: RegisterCodeData) =>
      axiosClient.post('/api/auth/register-code', data),

    resendCode: (data: RegisterCodeData) =>
      axiosClient.post('/api/auth/resend-code', data),

    /**
     * ✅ Map UI -> DOC:
     * UI sends: full_name + verification_code
     * API expects: name + code
     */
    register: (data: RegisterData) =>
      axiosClient.post('/api/auth/register', {
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        name: data.full_name,
        code: data.verification_code,
      }),

    login: (data: LoginData) =>
      axiosClient.post('/api/auth/login', data),

    logout: () =>
      axiosClient.post('/api/auth/logout'),

    logoutAll: () =>
      axiosClient.post('/api/auth/logout-all'),

    me: () =>
      axiosClient.get('/api/auth/me'),

    refreshToken: (refreshToken: string) =>
      axiosClient.post('/api/auth/refresh-token', { refresh_token: refreshToken }),

    validateToken: () =>
      axiosClient.post('/api/auth/validate'),

    updateProfile: (data: Partial<User>) =>
      axiosClient.put('/api/auth/profile', data),

    changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
      axiosClient.put('/api/auth/password', data),
  },

  /**
   * ✅ Option 1: Add alias that Profile.tsx expects:
   * api.profile.update(...)
   */
  profile: {
    update: (data: Partial<User>) =>
      axiosClient.put('/api/auth/profile', data),
  },

  items: {
    getAll: (filters?: ItemFilters) =>
      axiosClient.get('/api/items', { params: filters }),

    getById: (id: number) =>
      axiosClient.get(`/api/items/${id}`),

    create: (data: FormData) =>
      axiosClient.post('/api/items', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    update: (id: number, data: FormData) =>
      axiosClient.put(`/api/items/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    delete: (id: number) =>
      axiosClient.delete(`/api/items/${id}`),

    getMyListings: () =>
      axiosClient.get('/api/items/my-listings'),

    toggleStatus: (id: number) =>
      axiosClient.post(`/api/items/${id}/toggle-status`),
  },

  orders: {
    create: (data: { item_id: number; delivery_address_id: number; delivery_fee: number }) =>
      axiosClient.post('/api/orders', data),

    getAll: () =>
      axiosClient.get('/api/orders'),

    getAsSeller: () =>
      axiosClient.get('/api/orders/as-seller'),

    getById: (id: number) =>
      axiosClient.get(`/api/orders/${id}`),

    cancel: (id: number) =>
      axiosClient.put(`/api/orders/${id}/cancel`),

    confirm: (id: number) =>
      axiosClient.post(`/api/orders/${id}/confirm`),
  },

  favorites: {
    getAll: () =>
      axiosClient.get('/api/favorites'),

    add: (itemId: number) =>
      axiosClient.post(`/api/favorites/${itemId}`),

    remove: (itemId: number) =>
      axiosClient.delete(`/api/favorites/${itemId}`),
  },

  addresses: {
    getAll: () =>
      axiosClient.get('/api/addresses'),

    // ✅ Match doc fields (and your Checkout form)
    create: (data: {
      label: string;
      full_name: string;
      phone: string;
      address_line1: string;
      address_line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      latitude: number;
      longitude: number;
      is_default?: boolean;
    }) => axiosClient.post('/api/addresses', data),

    update: (id: number, data: Partial<Address>) =>
      axiosClient.put(`/api/addresses/${id}`, data),

    delete: (id: number) =>
      axiosClient.delete(`/api/addresses/${id}`),
  },

  driverApplications: {
    apply: (data: DriverApplicationData) =>
      axiosClient.post('/api/driver-applications', data),

    getMyApplication: () =>
      axiosClient.get('/api/driver-applications/my-application'),

    checkEligibility: () =>
      axiosClient.get('/api/driver-applications/eligibility'),
  },

  notifications: {
    getAll: () =>
      axiosClient.get('/api/notifications'),

    getUnreadCount: () =>
      axiosClient.get('/api/notifications/unread-count'),

    markAsRead: (id: number) =>
      axiosClient.post(`/api/notifications/${id}/mark-read`),

    markAllAsRead: () =>
      axiosClient.post('/api/notifications/mark-all-read'),
  },

  stats: {
    getPlatformStats: () =>
      axiosClient.get('/api/admin/stats'),
  },

  maps: {
    calculateDeliveryFee: (data: { pickup_lat: number; pickup_lng: number; delivery_lat: number; delivery_lng: number }) =>
      axiosClient.post('/api/calculate-delivery-fee', data),
  },
};

export default api;
