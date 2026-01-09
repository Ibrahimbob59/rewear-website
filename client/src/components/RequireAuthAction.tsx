import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const requireAuth = (action: () => void, returnUrl?: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      const url = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
      setLocation(url);
      return;
    }
    action();
  };

  return { requireAuth, isAuthenticated };
}
