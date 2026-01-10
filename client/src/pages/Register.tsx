import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Leaf, Eye, EyeOff, Loader2, ArrowLeft, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

const registerSchema = z
  .object({
    // ✅ API expects "name"
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(8, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    password_confirmation: z.string(),
    // ✅ API expects "code"
    code: z.string().min(6, 'Please enter the 6-digit code'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // from AuthContext
  const { requestRegistrationCode, register } = useAuth();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      code: '',
    },
  });

  const onRequestCode = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      await requestRegistrationCode(data.email);

      setUserEmail(data.email);

      // keep email in form for step 2
      registerForm.setValue('email', data.email);

      setStep('verify');
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your email for the 6-digit code.',
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send verification code.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
const onRegister = async (data: RegisterForm) => {
  setIsLoading(true);
  try {
    await register({
      full_name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      password_confirmation: data.password_confirmation,
      verification_code: data.code,
    });

    toast({
      title: 'Account Created!',
      description: 'Welcome to ReWear. You can now start shopping.',
    });
    setLocation('/');
  } catch (error: any) {
    const message = error.response?.data?.message || 'Registration failed. Please try again.';
    toast({
      title: 'Registration Failed',
      description: message,
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};



  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await requestRegistrationCode(userEmail);
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to resend code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <Leaf className="h-8 w-8 text-primary" />
                <span className="text-2xl font-semibold">ReWear</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Create an Account</CardTitle>
              <CardDescription>Enter your email to get started</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onRequestCode)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-continue">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Continue with Email
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="text-2xl font-semibold">ReWear</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Complete Registration</CardTitle>
            <CardDescription>We sent a verification code to {userEmail}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setStep('email')}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Change email
          </Button>

          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        {...field}
                        data-testid="input-verification-code"
                      />
                    </FormControl>
                    <FormMessage />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-0 text-primary hover:text-primary/90"
                      onClick={handleResendCode}
                      disabled={isLoading}
                    >
                      Resend code
                    </Button>
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
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
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          {...field}
                          className="pr-12"
                          data-testid="input-password"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                        data-testid="input-password-confirmation"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary font-medium hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
