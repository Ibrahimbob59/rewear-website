import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Package, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import api, { type Order } from '@/services/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function OrderDetails() {
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id ? parseInt(params.id) : 0;

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      const response = await api.orders.getById(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });

  const order: Order | undefined = orderData?.data || orderData;

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The order you're looking for doesn't exist.
        </p>
        <Link href="/orders">
          <Button data-testid="button-back-to-orders">Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Link href="/orders">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Order #{order.id}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <Badge className={`${statusColors[order.status] || 'bg-gray-100 text-gray-800'} text-sm px-3 py-1`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((orderItem) => (
                <div key={orderItem.id} className="flex gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                    {orderItem.item?.image && (
                      <img
                        src={orderItem.item.image}
                        alt={orderItem.item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/items/${orderItem.item_id}`}>
                      <h4 className="font-medium hover:text-primary transition-colors">
                        {orderItem.item?.title || `Item #${orderItem.item_id}`}
                      </h4>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {orderItem.quantity}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {formatPrice(orderItem.price * orderItem.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-muted-foreground">
                {order.shipping_address}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(order.total ?? 0)}</span>
                  </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total ?? 0)}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Last updated: {formatDate(order.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
