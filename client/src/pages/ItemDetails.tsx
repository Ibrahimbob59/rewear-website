import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingBag, Share2, ChevronLeft, User, MapPin, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import api, { type Item } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useRequireAuth } from '@/components/RequireAuthAction';
import { cn } from '@/lib/utils';

export default function ItemDetails() {
  const [, params] = useRoute('/items/:id');
  const itemId = params?.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { isFavorite, getFavoriteId, addFavorite, removeFavorite } = useFavorites();
  const { requireAuth } = useRequireAuth();

  const { data: itemData, isLoading } = useQuery({
    queryKey: ['/api/items', itemId],
    queryFn: async () => {
      const response = await api.items.getById(itemId);
      return response.data;
    },
    enabled: !!itemId,
  });

  const item: Item | undefined = itemData?.data || itemData;
  const isFav = item ? isFavorite(item.id) : false;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddToCart = () => {
    if (!item) return;
    requireAuth(() => {
      addToCart(item);
      toast({
        title: 'Added to Cart',
        description: `${item.title} has been added to your cart.`,
      });
    }, `/items/${item.id}`);
  };

  const handleFavorite = async () => {
    if (!item) return;
    requireAuth(async () => {
      try {
        if (isFav) {
          const favId = getFavoriteId(item.id);
          if (favId) await removeFavorite(favId);
          toast({ title: 'Removed from favorites' });
        } else {
          await addFavorite(item.id);
          toast({ title: 'Added to favorites' });
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to update favorites',
          variant: 'destructive',
        });
      }
    }, `/items/${item.id}`);
  };

  const handleShare = async () => {
    if (navigator.share && item) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch {
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Item Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The item you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button data-testid="button-back-to-shop">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Link href="/">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
            {item.is_donation && (
              <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                Donation
              </Badge>
            )}
          </div>
          {item.images && item.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {item.images.slice(0, 4).map((img, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`${item.title} ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-item-title">
                {item.title}
              </h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFavorite}
                  data-testid="button-favorite"
                >
                  <Heart className={cn('h-5 w-5', isFav && 'fill-destructive text-destructive')} />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} data-testid="button-share">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {item.category && (
              <Badge variant="secondary" className="mb-4">
                {item.category.name}
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary" data-testid="text-item-price">
              {item.is_donation ? 'Free' : formatPrice(item.price)}
            </span>
            {item.is_donation && (
              <span className="text-sm text-muted-foreground">(Donation item)</span>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              {item.condition && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Condition:</span>
                  <Badge variant="outline">{item.condition}</Badge>
                </div>
              )}
              {item.size && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Size:</span>
                  <Badge variant="outline">{item.size}</Badge>
                </div>
              )}
              {item.brand && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{item.brand}</span>
                </div>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-item-description">
              {item.description}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={item.status !== 'available'}
              data-testid="button-add-to-cart"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              {item.status === 'available' ? 'Add to Cart' : 'Not Available'}
            </Button>
          </div>

          {item.user && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.user.avatar} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{item.user.name}</p>
                    <p className="text-sm text-muted-foreground">Seller</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Listed {formatDate(item.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Local pickup available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
