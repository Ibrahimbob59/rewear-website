import * as React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Item, ItemImage } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useRequireAuth } from '@/components/RequireAuthAction';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item?: Item | null;
}

function getImageUrl(img: string | ItemImage | undefined | null): string | undefined {
  if (!img) return undefined;
  return typeof img === 'string' ? img : img.url;
}

export function ItemCard({ item }: ItemCardProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { requireAuth } = useRequireAuth();

  if (!item || item.id == null) return null;

  const itemId = item.id;
  const isFav = isFavorite(itemId);

  const coverImage =
    item.primary_image ||
    item.image ||
    getImageUrl(item.images?.[0]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    requireAuth(async () => {
      try {
        if (isFav) await removeFavorite(itemId);
        else await addFavorite(itemId);
      } catch {
        // ignore (ItemDetails will toast, ItemCard stays silent)
      }
    }, `/items/${itemId}`);
  };

  const priceNumber = Number(item.price);
  const formattedPrice =
    Number.isFinite(priceNumber)
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceNumber)
      : '$0.00';

  return (
    <Link href={`/items/${itemId}`}>
      <Card className="group overflow-visible cursor-pointer hover-elevate transition-all duration-200">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
          {coverImage ? (
            <img
              src={coverImage}
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
            data-testid={`button-favorite-${itemId}`}
          >
            <Heart
              className={cn('h-4 w-4', isFav ? 'text-destructive' : 'text-foreground')}
              // lucide icons default to fill="none"; force-fill when favorited
              fill={isFav ? 'currentColor' : 'none'}
            />
          </Button>

          {item.is_donation && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              Donation
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{item.title}</h3>

          {item.category?.name && (
            <p className="text-xs text-muted-foreground">{item.category.name}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-primary">
              {item.is_donation ? 'Free' : formattedPrice}
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
