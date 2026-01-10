// ItemCard.tsx
import { Heart } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Item } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useRequireAuth } from '@/components/RequireAuthAction';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { requireAuth } = useRequireAuth();

  const isFav = isFavorite(item.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    requireAuth(async () => {
      try {
        if (isFav) {
          await removeFavorite(item.id);
        } else {
          await addFavorite(item.id);
        }
      } catch {
        // ignore
      }
    }, `/items/${item.id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Link href={`/items/${item.id}`}>
      <Card
        className="group overflow-visible cursor-pointer hover-elevate transition-all duration-200"
        data-testid={`card-item-${item.id}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-secondary">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}

          <Button
            variant="secondary"
            size="icon"
            className={cn(
              'absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              isAuthenticated && 'opacity-100'
            )}
            onClick={handleFavoriteClick}
            data-testid={`button-favorite-${item.id}`}
          >
            <Heart className={cn('h-4 w-4', isFav && 'fill-destructive text-destructive')} />
          </Button>

          {item.is_donation && (
            <Badge
              className="absolute top-3 left-3 bg-primary text-primary-foreground"
              data-testid={`badge-donation-${item.id}`}
            >
              Donation
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2" data-testid={`text-item-title-${item.id}`}>
              {item.title}
            </h3>
          </div>

          {item.category && (
            <p className="text-xs text-muted-foreground" data-testid={`text-item-category-${item.id}`}>
              {item.category.name}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-primary" data-testid={`text-item-price-${item.id}`}>
              {item.is_donation ? 'Free' : formatPrice(item.price)}
            </span>
            {item.condition && (
              <Badge variant="secondary" className="text-xs">
                {item.condition}
              </Badge>
            )}
          </div>

          {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
