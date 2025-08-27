import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuthContext } from '@/context/AuthContext';
import { normalizeToE164, isValidPhoneNumber } from '@/lib/utils/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/use-auth';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  keepSignedIn: z.boolean().default(false),
});

const phoneSchema = z.object({
  phone: z.string().refine((phone) => isValidPhoneNumber(phone), {
    message: 'Please enter a valid phone number',
  }),
});

const verificationSchema = z.object({
  code: z.string().min(6, 'Please enter the 6-digit code'),
});

type AuthMode = 'signin' | 'signup';

function useAuthMode(): AuthMode {
  const [location] = useLocation();
  return useMemo(() => {
    const search = location.split('?')[1] || '';
    const p = new URLSearchParams(search).get('mode');
    console.log('Auth Mode Debug:', { location, search, mode: p, result: p === 'signup' ? 'signup' : 'signin' });
    return p === 'signup' ? 'signup' : 'signin';
  }, [location]);
}

export default function Auth() {
  const [location, navigate] = useLocation();
  const authMode = useAuthMode(); // Direct URL control, no local state
  
  // Parse redirect parameter - only allow internal paths
  const params = new URLSearchParams(location.split('?')[1] || '');
  const redirectRaw = params.get('redirect') || '/dashboard';
  const redirectUrl = redirectRaw.startsWith('/') ? redirectRaw : '/dashboard';
  const [phoneStep, setPhoneStep] = useState<'phone' | 'verify'>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmail, signUpWithEmail, sendPhoneVerification, verifyPhoneCode, resetPassword, loading } = useAuthContext();
  const { toast } = useToast();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      password: '',
      keepSignedIn: false,
    },
  });

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  });

  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const { user } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate(redirectUrl, { replace: true });
    }
  }, [user, navigate, redirectUrl]);

  const handleEmailAuth = async (data: z.infer<typeof emailSchema>) => {
    try {
      if (authMode === 'signin') {
        await signInWithEmail(data.email, data.password);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      } else {
        await signUpWithEmail(data.email, data.password);
        toast({
          title: 'Account created!',
          description: 'Your account has been created successfully.',
        });
      }
      // Redirect will happen via useEffect when user state changes
    } catch (error) {
      toast({
        title: 'Authentication failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePhoneVerification = async (data: z.infer<typeof phoneSchema>) => {
    try {
      const e164Number = normalizeToE164(data.phone);
      if (!e164Number) {
        throw new Error('Invalid phone number format');
      }

      await sendPhoneVerification(e164Number, 'recaptcha-container');
      setPhoneStep('verify');
      toast({
        title: 'Verification code sent',
        description: 'Please check your phone for the verification code.',
      });
    } catch (error) {
      toast({
        title: 'Failed to send code',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCodeVerification = async (data: z.infer<typeof verificationSchema>) => {
    try {
      await verifyPhoneCode(data.code);
      toast({
        title: 'Phone verified!',
        description: 'You have successfully signed in.',
      });
      // Redirect will happen via useEffect when user state changes
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = async () => {
    const email = emailForm.getValues('email');
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await resetPassword(email);
      toast({
        title: 'Reset link sent',
        description: 'Check your email for the password reset link.',
      });
    } catch (error) {
      toast({
        title: 'Failed to send reset link',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <span className="text-3xl font-bold text-primary">ShopLynk</span>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {authMode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {authMode === 'signup' 
              ? 'Start your journey with ShopLynk' 
              : 'Sign in to your account or create a new one'
            }
          </p>
        </div>

        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" data-testid="tab-email">Email</TabsTrigger>
                <TabsTrigger value="phone" data-testid="tab-phone">Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-6">
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(handleEmailAuth)} className="space-y-6">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="email">Email address</FormLabel>
                          <FormControl>
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              autoComplete="email"
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="password">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="pr-12"
                                {...field}
                                data-testid="input-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <FormField
                        control={emailForm.control}
                        name="keepSignedIn"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                id="keep-signed-in"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-keep-signed-in"
                              />
                            </FormControl>
                            <FormLabel htmlFor="keep-signed-in" className="text-sm font-normal">
                              Keep me signed in
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 font-normal"
                        onClick={handleForgotPassword}
                        data-testid="button-forgot-password"
                      >
                        Forgot password?
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        data-testid="button-sign-in"
                      >
                        {loading ? <LoadingSpinner size="sm" /> : authMode === 'signin' ? 'Sign in' : 'Create account'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const newMode = authMode === 'signin' ? 'signup' : 'signin';
                          const params = new URLSearchParams(location.split('?')[1] || '');
                          params.set('mode', newMode);
                          if (redirectUrl !== '/dashboard') {
                            params.set('redirect', redirectUrl);
                          }
                          navigate(`/auth?${params.toString()}`, { replace: true });
                        }}
                        data-testid="button-toggle-mode"
                      >
                        {authMode === 'signin' ? 'Create account' : 'Sign in instead'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="phone" className="mt-6">
                {phoneStep === 'phone' ? (
                  <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(handlePhoneVerification)} className="space-y-6">
                      <FormField
                        control={phoneForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="phone">Phone number</FormLabel>
                            <FormControl>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                autoComplete="tel"
                                {...field}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              We'll send a verification code via SMS
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        data-testid="button-send-code"
                      >
                        {loading ? <LoadingSpinner size="sm" /> : 'Send verification code'}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...verificationForm}>
                    <form onSubmit={verificationForm.handleSubmit(handleCodeVerification)} className="space-y-6">
                      <FormField
                        control={verificationForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="verification-code">Verification code</FormLabel>
                            <FormControl>
                              <Input
                                id="verification-code"
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                autoComplete="one-time-code"
                                className="text-center text-2xl tracking-widest"
                                {...field}
                                data-testid="input-verification-code"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Enter the 6-digit code sent to your phone
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        data-testid="button-verify-code"
                      >
                        {loading ? <LoadingSpinner size="sm" /> : 'Verify & Sign in'}
                      </Button>

                      <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => setPhoneStep('phone')}
                        data-testid="button-back-to-phone"
                      >
                        Back to phone number
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
