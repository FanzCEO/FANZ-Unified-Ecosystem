import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export function useLogout() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/logout');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: 'Logout failed',
        description: error.message || 'Failed to logout',
        variant: 'destructive',
      });
    },
  });
}