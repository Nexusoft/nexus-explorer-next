import 'styles/globals.scss';
import { ContextWrapper } from 'contexts/AppContext';
import { QueryClientProvider, QueryClient } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { IconContext } from 'react-icons';
import { useState } from 'react';

import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
TimeAgo.addDefaultLocale(en);
TimeAgo.addLocale(en);

const queryOptions = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
};

function MyApp({ Component, pageProps }) {
  //one cache per app instance: a module level cache is shared by all server renders
  //and leaks older data into later pages (hydration mismatches)
  const [queryClient] = useState(() => new QueryClient(queryOptions));

  return (
    <ContextWrapper>
      <IconContext.Provider
        value={{
          color: 'currentColor',
          size: '1.25rem',
          style: { verticalAlign: 'middle' },
        }}>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
          <ReactQueryDevtools position="bottom-right" />
        </QueryClientProvider>
      </IconContext.Provider>
    </ContextWrapper>
  );
}

export default MyApp;
