'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState } from 'react';
import type { Persister } from '@tanstack/react-query-persist-client';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, 
        gcTime: 1000 * 60 * 60 * 24, 
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [persister] = useState<Persister>(() => {
    if (typeof window !== 'undefined') {
      return createSyncStoragePersister({
        storage: window.localStorage,
      });
    }
    
    return {
      persistClient: () => undefined,
      restoreClient: () => undefined,
      removeClient: () => undefined,
    };
  });

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}