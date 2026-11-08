import Router, { useRouter } from 'next/router';
import { useCallback } from 'react';

//true once the app moved between pages, so history has an explorer page to go back to
let movedInApp = false;
if (typeof window !== 'undefined') {
  Router.events.on('routeChangeComplete', () => {
    movedInApp = true;
  });
}

/** Back to the previous explorer page, or to fallback when the page was opened directly */
export function useBack(fallback = '/') {
  const router = useRouter();
  return useCallback(() => {
    if (movedInApp) {
      router.back();
    } else {
      router.push(fallback);
    }
  }, [router, fallback]);
}
