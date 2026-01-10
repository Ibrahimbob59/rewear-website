import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronLeft, Loader2, CheckCircle, MapPin, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import api, { type Address } from '@/services/api';

// --------------------
// Forms
// --------------------

const orderSchema = z.object({
  delivery_address_id: z.coerce.number().int().positive('Please select an address'),
  notes: z.string().optional(),
});
type OrderForm = z.infer<typeof orderSchema>;

const addressSchema = z.object({
  label: z.string().min(2, 'Label is required'),
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Phone is required'),
  address_line1: z.string().min(5, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postal_code: z.string().min(2, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  is_default: z.boolean().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

export default function Checkout() {
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { items, getTotal, clearCart } = useCart();

  // Enforce 1 item only (API order is single item_id)
  useEffect(() => {
    if (items.length === 0) {
      setLocation('/cart');
      return;
    }
    if (items.length > 1) {
      toast({
        title: 'Only 1 item per order',
        description: 'Please keep only one item in cart, then checkout.',
        variant: 'destructive',
      });
      setLocation('/cart');
    }
  }, [items.length, setLocation, toast]);

  const firstCartItem = useMemo(() => items[0]?.item, [items]);

  const orderForm = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      delivery_address_id: undefined as unknown as number,
      notes: '',
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Lebanon',
      latitude: 33.8938,
      longitude: 35.5018,
      is_default: false,
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const loadAddresses = async () => {
    setIsAddressLoading(true);
    try {
      const res = await api.addresses.getAll();
      const list: Address[] = res.data?.data?.addresses || res.data?.addresses || [];
      setAddresses(list);

      // auto-select default or first
      const def = list.find((a) => a.is_default);
      const first = def?.id ?? list[0]?.id;
      if (first) orderForm.setValue('delivery_address_id', first);

      setShowNewAddress(list.length === 0);
    } catch (e: any) {
      toast({
        title: 'Failed to load addresses',
        description: e.response?.data?.message || 'Could not load your saved addresses.',
        variant: 'destructive',
      });
      setShowNewAddress(true);
    } finally {
      setIsAddressLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();

    // auto-fill lat/lng if allowed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          addressForm.setValue('latitude', pos.coords.latitude);
          addressForm.setValue('longitude', pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Keep this for "Add New Address" flow if you want to create address and NOT auto-place order)
  const createAddressThenSelect = async (data: AddressForm) => {
    setIsLoading(true);
    try {
      const res = await api.addresses.create({
        ...data,
        is_default: !!data.is_default,
      });

      const newId = res.data?.data?.id ?? res.data?.data?.address?.id ?? res.data?.id;
      if (!newId) throw new Error('No address id returned');

      toast({ title: 'Address saved', description: 'Your new address has been added.' });

      await loadAddresses();
      orderForm.setValue('delivery_address_id', Number(newId));
      setShowNewAddress(false);
    } catch (e: any) {
      toast({
        title: 'Address creation failed',
        description: e.response?.data?.message || 'Could not create address. Please check fields.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async (data: OrderForm) => {
    if (!firstCartItem) return;

    setIsLoading(true);
    try {
      const response = await api.orders.create({
        item_id: firstCartItem.id,
        delivery_address_id: data.delivery_address_id,
        delivery_fee: 0,
      });

      const newOrderId = response.data?.data?.id || response.data?.id;
      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();

      toast({
        title: 'Order Placed!',
        description: 'Your order has been successfully placed.',
      });
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.response?.data?.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ OPTION 1: Save Address then immediately Place Order
  const saveAddressAndPlaceOrder = async (data: AddressForm) => {
    if (!firstCartItem) return;

    setIsLoading(true);
    try {
      // 1) Create address
      const res = await api.addresses.create({
        ...data,
        is_default: !!data.is_default,
      });

      const newId = res.data?.data?.id ?? res.data?.data?.address?.id ?? res.data?.id;
      if (!newId) throw new Error('No address id returned');

      // 2) Place order using newly created address id
      const response = await api.orders.create({
        item_id: firstCartItem.id,
        delivery_address_id: Number(newId),
        delivery_fee: 0,
      });

      const newOrderId = response.data?.data?.id || response.data?.id;

      setOrderId(newOrderId);
      setOrderComplete(true);
      clearCart();

      toast({
        title: 'Order Placed!',
        description: 'Address saved and order placed successfully.',
      });
    } catch (e: any) {
      toast({
        title: 'Checkout failed',
        description: e.response?.data?.message || 'Could not complete checkout.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-2">
            Thank you for your order. We've sent you an email with your order details.
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground mb-6">
              Order ID: <span className="font-medium">#{orderId}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={orderId ? `/orders/${orderId}` : '/orders'}>
              <Button data-testid="button-view-order">View Order</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" data-testid="button-continue-shopping">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!firstCartItem) return null;

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <Link href="/cart">
        <Button variant="ghost" className="mb-6" data-testid="button-back-to-cart">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {isAddressLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading your addresses...
                </div>
              ) : (
                <>
                  {/* FLOW A: saved addresses */}
                  {!showNewAddress && addresses.length > 0 && (
                    <Form {...orderForm}>
                      <form onSubmit={orderForm.handleSubmit(placeOrder)} className="space-y-4">
                        <FormField
                          control={orderForm.control}
                          name="delivery_address_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Saved Address</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                >
                                  {addresses.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.label} — {a.address_line1}, {a.city} ({a.phone})
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={orderForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any special instructions for delivery..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewAddress(true)}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Address
                          </Button>

                          <Button type="submit" className="flex-1" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              `Place Order - ${formatPrice(getTotal())}`
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}

                  {/* FLOW B: no addresses -> create */}
                  {(showNewAddress || addresses.length === 0) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Create a new delivery address (lat/lng required).
                        </p>
                        {addresses.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowNewAddress(false)}
                            disabled={isLoading}
                          >
                            Use saved address
                          </Button>
                        )}
                      </div>

                      <Form {...addressForm}>
                        <form
                          // ✅ CHANGED: this now saves address AND places order
                          onSubmit={addressForm.handleSubmit(saveAddressAndPlaceOrder)}
                          className="space-y-4"
                        >
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="label"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Label</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Home / Office" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addressForm.control}
                              name="full_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={addressForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="+961..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="address_line1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl>
                                  <Input placeholder="Street, building..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="address_line2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Line 2 (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Apt, floor..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Beirut" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addressForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Beirut" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="postal_code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input placeholder="1107" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addressForm.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Lebanon" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={addressForm.control}
                              name="latitude"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Latitude</FormLabel>
                                  <FormControl>
                                    <Input placeholder="33.8938" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={addressForm.control}
                              name="longitude"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Longitude</FormLabel>
                                  <FormControl>
                                    <Input placeholder="35.5018" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* ✅ CHANGED BUTTON: final action */}
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              `Save Address & Place Order - ${formatPrice(getTotal())}`
                            )}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map(({ item, quantity }) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                      <p className="text-sm font-medium text-primary">
                        {item.is_donation ? 'Free' : formatPrice(item.price * quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(getTotal())}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
