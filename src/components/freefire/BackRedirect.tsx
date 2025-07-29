'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BackRedirectProps {
  redirectTo: string;
}

const BackRedirect: React.FC<BackRedirectProps> = ({ redirectTo }) => {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentPath = window.location.pathname;

    const handlePopState = (event: PopStateEvent) => {
        // Only redirect if the user is trying to go back from our "redirect" state
        if(event.state && event.state.page === 'redirect'){
           window.location.href = redirectTo;
        }
    };
    
    // Replace the current state so there's no "forward" history from this page initially.
    window.history.replaceState({ page: 'current' }, '', currentPath);
    
    // Push a new state that we can identify. This is what the "back" button will pop.
    window.history.pushState({ page: 'redirect' }, '', currentPath);
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, redirectTo]);

  return null; // This component does not render anything.
};

export default BackRedirect;
