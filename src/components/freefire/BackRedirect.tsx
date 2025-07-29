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
    // Flag to mark that the redirect was initiated by this component
    if (pathname === '/buy') {
      sessionStorage.setItem('cameFromBackRedirect', 'true');
    }

    const onPopState = (e: PopStateEvent) => {
      // Prevent the default back navigation
      e.preventDefault();
      // Manually redirect to the desired page
      router.replace(redirectTo);
    };

    // This pushes a new state to the history, so the back button will trigger our listener
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      // Clean up the flag when the component unmounts
      if (pathname === '/buy') {
         sessionStorage.removeItem('cameFromBackRedirect');
      }
    };
  }, [router, redirectTo, pathname]);

  return null; // This component does not render anything.
};

export default BackRedirect;
