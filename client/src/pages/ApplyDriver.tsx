import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

const driverSchema = z.object({
  vehicle_type: z.string().min(1, 'Vehicle type is required'),
  license_number: z.string().min(5, 'License number is required'),
  vehicle_plate: z.string().min(3, 'Vehicle plate is required'),
  experience_years: z.string().min(1, 'Experience years is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  coverage_areas: z.string().min(3, 'Coverage areas are required'),
  notes: z.string().optional(),
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
        return response.data.data || response.data;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
  });

  const form = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      vehicle_type: '',
      license_number: '',
      vehicle_plate: '',
      experience_years: '',
      phone: user?.phone || '',
      coverage_areas: '',
      notes: '',
    },
  });

  const onSubmit = async (data: DriverForm) => {
    setIsLoading(true);
    try {
      await api.driverApplications.apply({
        vehicle_type: data.vehicle_type,
        license_number: data.license_number,
        vehicle_plate: data.vehicle_plate,
        experience_years: parseInt(data.experience_years),
        phone: data.phone,
        coverage_areas: data.coverage_areas.split(',').map(s => s.trim()),
        notes: data.notes,
      });
      setIsSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'We will review your application and get back to you soon.',
      });
    } catch (error: any) {
      toast({
        title: 'Application Failed',
        description: error.response?.data?.message || 'Failed to submit application. Please try again.',
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
          <p className="text-muted-foreground mb-6">
            Please login to apply as a driver.
          </p>
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

    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            {existingApplication.status === 'approved' ? (
              <CheckCircle className="h-10 w-10 text-primary" />
            ) : (
              <AlertCircle className="h-10 w-10 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Status</h1>
          <p className="text-muted-foreground mb-4">
            You have already submitted a driver application.
          </p>
          <div className={`inline-block px-4 py-2 rounded-full font-medium ${statusColors[existingApplication.status] || 'bg-gray-100'}`}>
            Status: {existingApplication.status?.replace('_', ' ').toUpperCase()}
          </div>
          <div className="mt-6">
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">Back to Home</Button>
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
            Thank you for your interest in becoming a ReWear driver.
            We'll review your application and contact you within 2-3 business days.
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
            Join our team and help deliver sustainable fashion to customers in your area.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Application</CardTitle>
            <CardDescription>
              Fill out the form below to apply as a delivery driver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your driver's license number" {...field} data-testid="input-license-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicle_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Plate Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ABC 123" {...field} data-testid="input-vehicle-plate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-experience">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Less than 1 year</SelectItem>
                            <SelectItem value="1">1-2 years</SelectItem>
                            <SelectItem value="3">3-5 years</SelectItem>
                            <SelectItem value="5">5+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+961 XX XXX XXX" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coverage_areas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coverage Areas</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Beirut, Mount Lebanon, Tripoli" {...field} data-testid="input-coverage-areas" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about your experience or availability..."
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isLoading} data-testid="button-submit">
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
