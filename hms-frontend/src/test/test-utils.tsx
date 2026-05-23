import React, { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Stabilize React 19 act
const R = React as unknown as { act: typeof act };
if (typeof R.act !== 'function') {
  R.act = act;
}

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = React.useState(() => createTestQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <React.Suspense fallback={<div>Loading test...</div>}>
          {children}
        </React.Suspense>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

