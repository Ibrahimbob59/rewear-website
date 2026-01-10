import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Edit, Trash2, Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import api, { type Item } from '@/services/api';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sold: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function MyListings() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['/api/my-items'],
    queryFn: async () => {
      const response = await api.items.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.items.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my-items'] });
      toast({
        title: 'Item Deleted',
        description: 'Your listing has been removed.',
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const items: Item[] = itemsData?.data || itemsData || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-[3/4] w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <Store className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Listings Yet</h1>
          <p className="text-muted-foreground mb-6">
            You haven't listed any items for sale or donation yet.
          </p>
          <Link href="/sell">
            <Button data-testid="button-create-listing">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Listing
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">My Listings</h1>
        <Link href="/sell">
          <Button data-testid="button-new-listing">
            <Plus className="h-4 w-4 mr-2" />
            New Listing
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-visible" data-testid={`card-listing-${item.id}`}>
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-muted">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Store className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <Badge className={`absolute top-3 left-3 ${statusColors[item.status]}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
              {item.is_donation && (
                <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                  Donation
                </Badge>
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-medium line-clamp-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {item.category?.name}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">
                  {item.is_donation ? 'Free' : formatPrice(item.price)}
                </span>
                <div className="flex gap-1">
                  <Link href={`/items/${item.id}`}>
                    <Button variant="ghost" size="icon" data-testid={`button-view-${item.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(item.id)}
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
