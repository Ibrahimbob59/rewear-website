import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { Link } from 'wouter';

/**
 * Backend expects multipart/form-data:
 * full_name* (string)
 * phone* (string)
 * email (string optional)
 * address* (string)
 * city* (string)
 * vehicle_type* (string)
 * id_document (file)
 * driving_license (file)
 * vehicle_registration (file) // optional for bicycles
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (matches docs)

const fileSchema = z
  .any()
  .optional()
  .refine((f) => !f || f instanceof File, 'Invalid file')
  .refine((f) => !f || f.size <= MAX_FILE_SIZE, 'File is too large (max 5MB)');

const driverSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    phone: z.string().min(8, 'Phone is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().min(3, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    vehicle_type: z.enum(['car', 'motorcycle', 'van', 'bicycle'], {
      required_error: 'Vehicle type is required',
    }),

    id_document: fileSchema,
    driving_license: fileSchema,
    vehicle_registration: fileSchema,
  })
  .superRefine((data, ctx) => {
    if (data.vehicle_type !== 'bicycle' && !(data.vehicle_registration instanceof File)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['vehicle_registration'],
        message: 'Vehicle registration is required (optional for bicycles)',
      });
    }
  });

type DriverForm = z.infer<typeof driverSchema>;

export default function ApplyDriver() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const { data: existingApplication, isLoading: isCheckingApplication } = useQuery({
    queryKey: ['/api/driver-applications/my-application'],
    queryFn: async () => {
      try {
        const response = await api.driverApplications.getMyApplication();
        return response.data?.data ?? response.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
  });

  const defaultFullName = useMemo(() => {
    const u = user as any;
    return u?.full_name || u?.name || '';
  }, [user]);

  const defaultEmail = useMemo(() => {
    const u = user as any;
    return u?.email || '';
  }, [user]);

  const defaultPhone = useMemo(() => {
    const u = user as any;
    return u?.phone || '';
  }, [user]);

  const form = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      full_name: defaultFullName,
      phone: defaultPhone,
      email: defaultEmail,
      address: '',
      city: '',
      vehicle_type: 'car',
      id_document: undefined,
      driving_license: undefined,
      vehicle_registration: undefined,
    },
  });

  const vehicleType = form.watch('vehicle_type');

  const onSubmit = async (data: DriverForm) => {
    setIsLoading(true);
    try {
      const fd = new FormData();

      fd.append('full_name', data.full_name);
      fd.append('phone', data.phone);

      if (data.email && data.email.trim().length > 0) {
        fd.append('email', data.email.trim());
      }

      fd.append('address', data.address);
      fd.append('city', data.city);
      fd.append('vehicle_type', data.vehicle_type);

      if (data.id_document instanceof File) fd.append('id_document', data.id_document);
      if (data.driving_license instanceof File) fd.append('driving_license', data.driving_license);
      if (data.vehicle_registration instanceof File) {
        fd.append('vehicle_registration', data.vehicle_registration);
      }

      await api.driverApplications.apply(fd);

      setIsSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'We will review your application and get back to you soon.',
      });
    } catch (error: any) {
      toast({
        title: 'Application Failed',
        description:
          error.response?.data?.message ||
          'Failed to submit application. Please try again.',
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
            <Truck className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please login to apply as a driver.</p>
          <Link href="/login?returnUrl=/apply-driver">
            <Button data-testid="button-login">Login to Continue</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isCheckingApplication) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground mt-4">Checking application status...</p>
      </div>
    );
  }

  if (existingApplication) {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600',
      under_review: 'bg-blue-500/10 text-blue-600',
      approved: 'bg-green-500/10 text-green-600',
      rejected: 'bg-red-500/10 text-red-600',
    };

    const rawStatus =
      typeof existingApplication.status === 'string' ? existingApplication.status : 'pending';

    const statusText = rawStatus.replace(/_/g, ' ').toUpperCase();

    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            {rawStatus === 'approved' ? (
              <CheckCircle className="h-10 w-10 text-primary" />
            ) : (
              <AlertCircle className="h-10 w-10 text-primary" />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">Application Status</h1>
          <p className="text-muted-foreground mb-4">
            You have already submitted a driver application.
          </p>

          <div
            className={`inline-block px-4 py-2 rounded-full font-medium ${
              statusColors[rawStatus] || 'bg-gray-100 text-gray-700'
            }`}
          >
            Status: {statusText}
          </div>

          <div className="mt-6">
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your interest in becoming a ReWear driver. We’ll review your
            application and contact you soon.
          </p>

          <Link href="/">
            <Button data-testid="button-back-home">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Become a ReWear Driver</h1>
          <p className="text-muted-foreground">
            Fill your details and upload documents to apply as a driver.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Application</CardTitle>
            <CardDescription>All fields with * are required.</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} data-testid="input-full-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+961 XX XXX XXX" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="name@email.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Beirut" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Street, building, floor..." {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-vehicle-type">
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="motorcycle">Motorcycle</SelectItem>
                          <SelectItem value="van">Van</SelectItem>
                          <SelectItem value="bicycle">Bicycle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="id_document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Document</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            data-testid="input-id-document"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="driving_license"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driving License</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            data-testid="input-driving-license"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_registration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Vehicle Registration {vehicleType === 'bicycle' ? '(optional)' : '*'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                            data-testid="input-vehicle-registration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
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
