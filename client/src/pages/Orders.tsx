import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import api, { type Order } from '@/services/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function Orders() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await api.orders.getAll();
      return response.data;
    },
  });

  const orders: Order[] = ordersData?.data || ordersData || [];

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">No Orders Yet</h1>
          <p className="text-muted-foreground mb-6">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link href="/">
            <Button data-testid="button-start-shopping">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link href={`/orders/${order.id}`} key={order.id}>
            <Card className="hover-elevate cursor-pointer" data-testid={`card-order-${order.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">Order #{order.id}</h3>
                      <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Placed on {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm">
                      {order.items?.length || 0} item(s) • <span className="font-medium text-primary">{formatPrice(order.total ?? 0)}</span>
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
