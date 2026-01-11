import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import api, { type Item } from '@/services/api';
import type { AxiosError } from 'axios';

function isAlreadyFavoritedError(err: unknown) {
  const e = err as AxiosError<any>;
  const status = e?.response?.status;
  const msg = String((e?.response?.data as any)?.message ?? '').toLowerCase();
  return status === 400 && (msg.includes('already') || msg.includes('favorite'));
}

function isNotFavoritedError(err: unknown) {
  const e = err as AxiosError<any>;
  const status = e?.response?.status;
  const msg = String((e?.response?.data as any)?.message ?? '').toLowerCase();
  return (status === 404 || status === 400) && (msg.includes('not') || msg.includes('favorite'));
}

interface FavoritesContextType {
  favoriteItems: Item[];
  isLoading: boolean;
  addFavorite: (itemId: number) => Promise<void>;
  removeFavorite: (itemId: number) => Promise<void>;
  isFavorite: (itemId: number) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

function extractItemsArray(payload: any): Item[] {
  // Your backend: { success, message, data: [ ...items ], meta: {...} }
  const arr = payload?.data?.data ?? payload?.data ?? payload;
  return Array.isArray(arr) ? (arr as Item[]) : [];
}

export function FavoritesProvider({ children, isAuthenticated }: FavoritesProviderProps) {
  const [favoriteItems, setFavoriteItems] = useState<Item[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const syncIdsFromItems = (items: Item[]) => {
    const ids = new Set<number>();
    for (const it of items) {
      if (it?.id != null) ids.add(Number(it.id));
    }
    setFavoriteIds(ids);
  };

  const refreshFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteItems([]);
      setFavoriteIds(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.favorites.getAll();
      const items = extractItemsArray(response.data);
      setFavoriteItems(items);
      syncIdsFromItems(items);
    } catch {
      setFavoriteItems([]);
      setFavoriteIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const addFavorite = async (itemId: number) => {
    if (!isAuthenticated) return;

    const id = Number(itemId);

    // ✅ optimistic: mark as favorited instantly
    setFavoriteIds((prev) => new Set(prev).add(id));

    try {
      await api.favorites.add(id);
    } catch (err) {
      // ✅ backend may return 400 "Already in favorites" — treat as success
      if (!isAlreadyFavoritedError(err)) {
        // rollback optimistic change
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        throw err;
      }
    } finally {
      await refreshFavorites();
    }
  };

  const removeFavorite = async (itemId: number) => {
    if (!isAuthenticated) return;

    const id = Number(itemId);

    // ✅ optimistic: unmark instantly
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    // also optimistically remove from favoriteItems list
    setFavoriteItems((prev) => prev.filter((it) => Number(it.id) !== id));

    try {
      await api.favorites.remove(id);
    } catch (err) {
      // ✅ backend may return 404 "Not in favorites" — treat as success
      if (!isNotFavoritedError(err)) {
        throw err;
      }
    } finally {
      await refreshFavorites();
    }
  };

  const isFavorite = (itemId: number) => favoriteIds.has(Number(itemId));

  return (
    <FavoritesContext.Provider
      value={{
        favoriteItems,
        isLoading,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
