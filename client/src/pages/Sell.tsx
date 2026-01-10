import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Upload, Loader2, Tag, DollarSign, Image as ImageIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];

const conditionOptions: Array<{ label: string; value: 'new' | 'like_new' | 'good' | 'fair' }> = [
  { label: 'New', value: 'new' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
];

// ✅ MUST match backend enum exactly
const categories = [
  { label: 'Tops', value: 'tops' },
  { label: 'Bottoms', value: 'bottoms' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Shoes', value: 'shoes' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Other', value: 'other' },
] as const;

const sellSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),

    category: z.enum(['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'other'], {
      required_error: 'Please select a category',
    }),

    size: z.string().optional(),
    condition: z.enum(['new', 'like_new', 'good', 'fair'], {
      required_error: 'Please select a condition',
    }),

    brand: z.string().optional(),
    color: z.string().optional(),

    is_donation: z.boolean().default(false),

    price: z.string().optional(),
    donation_quantity: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.is_donation) {
      const q = Number(data.donation_quantity);
      if (!data.donation_quantity || Number.isNaN(q) || q < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['donation_quantity'],
          message: 'Quantity is required for donation items (min 1).',
        });
      }
    } else {
      const p = Number(data.price);
      if (!data.price || Number.isNaN(p) || p < 0.01) {
        ctx.addIssue({
          code: 'custom',
          path: ['price'],
          message: 'Price is required for sale items (min $0.01).',
        });
      }
    }
  });

type SellForm = z.infer<typeof sellSchema>;

export default function Sell() {
  const [isLoading, setIsLoading] = useState(false);

  // ✅ backend wants images array (1-6)
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const form = useForm<SellForm>({
    resolver: zodResolver(sellSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'tops',
      size: '',
      condition: 'new',
      brand: '',
      color: '',
      is_donation: false,
      price: '',
      donation_quantity: '',
    },
  });

  const isDonation = form.watch('is_donation');

  useEffect(() => {
    // clear the other field to avoid backend validator conflicts
    if (isDonation) {
      form.setValue('price', '');
    } else {
      form.setValue('donation_quantity', '');
    }
  }, [isDonation, form]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const next = [...imageFiles, ...files].slice(0, 6);

    // validate type/size
    for (const f of next) {
      if (!f.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'All files must be images.',
          variant: 'destructive',
        });
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Each image must be max 5MB.',
          variant: 'destructive',
        });
        return;
      }
    }

    setImageFiles(next);

    // previews
    Promise.all(
      next.map(
        (f) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          })
      )
    ).then(setImagePreviews);
  };

  const removeImageAt = (index: number) => {
    const nextFiles = imageFiles.filter((_, i) => i !== index);
    const nextPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(nextFiles);
    setImagePreviews(nextPreviews);
  };

  const onSubmit = async (data: SellForm) => {
    if (imageFiles.length < 1) {
      toast({
        title: 'Images Required',
        description: 'Please upload at least one image.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const fd = new FormData();

      fd.append('title', data.title);
      fd.append('description', data.description);

      // ✅ exact backend keys
      fd.append('category', data.category);
      fd.append('condition', data.condition);

      if (data.size) fd.append('size', data.size);
      if (data.brand) fd.append('brand', data.brand);
      if (data.color) fd.append('color', data.color);

      // ✅ boolean
fd.append('is_donation', data.is_donation ? '1' : '0');

      if (data.is_donation) {
        fd.append('donation_quantity', String(Number(data.donation_quantity)));
      } else {
        fd.append('price', String(Number(data.price)));
      }

      // ✅ IMPORTANT: images must be array
      // Laravel validation: 'images' => 'required|array' and 'images.*' => image...
      imageFiles.forEach((file, idx) => {
        fd.append(`images[${idx}]`, file);
      });

      await api.items.create(fd);

      toast({
        title: 'Item Listed!',
        description: data.is_donation
          ? 'Your donation item has been listed successfully.'
          : 'Your item has been listed for sale.',
      });

      setLocation('/my-listings');
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : null) ||
        'Failed to list item. Please try again.';
      toast({
        title: 'Listing Failed',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
            <Tag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-6">
            Please login to list an item for sale or donation.
          </p>
          <Link href="/login?returnUrl=/sell">
            <Button data-testid="button-login">Login to Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">List Your Item</h1>
        <p className="text-muted-foreground mb-8">
          Give your clothes a second life by selling or donating them to our community.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Item Details
            </CardTitle>
            <CardDescription>
              Provide accurate details to help buyers find your item.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Images */}
                <div className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Item Photos (1–6)
                  </FormLabel>

                  {imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={src}
                            alt={`Preview ${idx + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeImageAt(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload item photos</p>
                        <p className="text-xs text-muted-foreground mt-1">Up to 6 images, max 5MB each</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImagesChange}
                      />
                    </label>
                  )}

                  {imagePreviews.length > 0 && imagePreviews.length < 6 && (
                    <div>
                      <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Add more images
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImagesChange}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Vintage Denim Jacket" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Material, fit, flaws, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditionOptions.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sizes.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Zara" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Black" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_donation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Donate this item</FormLabel>
                        <FormDescription>
                          If donation is enabled, you must provide quantity and no price.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isDonation ? (
                  <FormField
                    control={form.control}
                    name="donation_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donation Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Price (USD)
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Listing...
                    </>
                  ) : isDonation ? (
                    'List as Donation'
                  ) : (
                    'List for Sale'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
