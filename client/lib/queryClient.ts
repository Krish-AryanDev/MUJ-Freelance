import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Static-like data: profile snapshots, category-ish metadata, searchable listings.
queryClient.setQueryDefaults(['profile'], {
  staleTime: 1000 * 60 * 10,
  gcTime: 1000 * 60 * 60,
});

queryClient.setQueryDefaults(['freelancers'], {
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 30,
});

queryClient.setQueryDefaults(['projects'], {
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 30,
});

queryClient.setQueryDefaults(['project'], {
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 30,
});

queryClient.setQueryDefaults(['search'], {
  staleTime: 1000 * 60 * 2,
  gcTime: 1000 * 60 * 20,
});

// Dynamic dashboard data.
queryClient.setQueryDefaults(['orders'], {
  staleTime: 1000 * 45,
  gcTime: 1000 * 60 * 15,
});

queryClient.setQueryDefaults(['notifications'], {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 10,
});

// Realtime-adjacent data should remain fresh.
queryClient.setQueryDefaults(['notificationUnreadCount'], {
  staleTime: 1000 * 10,
  gcTime: 1000 * 60 * 5,
});

queryClient.setQueryDefaults(['messages'], {
  staleTime: 0,
  gcTime: 1000 * 60 * 5,
  refetchOnWindowFocus: true,
});
