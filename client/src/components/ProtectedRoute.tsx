import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { type ComponentType } from 'react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location);
    return <Redirect to={`/login?returnUrl=${returnUrl}`} />;
  }

  return <>{children}</>;
}

export function withProtectedRoute<P extends object>(
  WrappedComponent: ComponentType<P>
): ComponentType<P> {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const [location] = useLocation();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(location);
      return <Redirect to={`/login?returnUrl=${returnUrl}`} />;
    }

    return <WrappedComponent {...props} />;
  };
}
