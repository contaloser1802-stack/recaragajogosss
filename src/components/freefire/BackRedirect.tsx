'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface BackRedirectProps {
  redirectTo: string;
}

const BackRedirect: React.FC<BackRedirectProps> = ({ redirectTo }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let urlBackRedirect = redirectTo.trim() +
      (redirectTo.indexOf('?') > 0 ? '&' : '?') +
      document.location.search.replace('?', '').toString();

    // Push states to history to handle back button
    history.pushState(null, '', location.href);
    history.pushState(null, '', location.href);
    history.pushState(null, '', location.href);

    const onPopState = (e: PopStateEvent) => {
      // Prevent the default back navigation and redirect
      e.preventDefault();
      location.href = urlBackRedirect;
    };
    
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [router, redirectTo, pathname]);

  return null; // This component does not render anything.
};

export default BackRedirect;
