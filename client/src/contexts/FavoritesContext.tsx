import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api, { type Favorite } from '@/services/api';

interface FavoritesContextType {
  favorites: Favorite[];
  isLoading: boolean;
  addFavorite: (itemId: number) => Promise<void>;
  removeFavorite: (favoriteId: number) => Promise<void>;
  isFavorite: (itemId: number) => boolean;
  getFavoriteId: (itemId: number) => number | null;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

export function FavoritesProvider({ children, isAuthenticated }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.favorites.getAll();
      setFavorites(response.data.data || response.data || []);
    } catch {
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const addFavorite = async (itemId: number) => {
    const response = await api.favorites.add(itemId);
    const newFavorite = response.data.data || response.data;
    setFavorites((current) => [...current, newFavorite]);
  };

  const removeFavorite = async (favoriteId: number) => {
    await api.favorites.remove(favoriteId);
    setFavorites((current) => current.filter((f) => f.id !== favoriteId));
  };

  const isFavorite = (itemId: number) => {
    return favorites.some((f) => f.item_id === itemId);
  };

  const getFavoriteId = (itemId: number) => {
    const favorite = favorites.find((f) => f.item_id === itemId);
    return favorite ? favorite.id : null;
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        addFavorite,
        removeFavorite,
        isFavorite,
        getFavoriteId,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
