'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  // We need to check if 'window' is defined, so it doesn't crash on the server
  const isWindowAvailable = typeof window !== 'undefined';
  
  const [matches, setMatches] = useState(() => {
    if (isWindowAvailable) {
      return window.matchMedia(query).matches;
    }
    return false; // Default value for server-side rendering
  });

  useEffect(() => {
    if (!isWindowAvailable) {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    // 'change' event is more efficient than 'resize' for media queries
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query, isWindowAvailable]);

  return matches;
}