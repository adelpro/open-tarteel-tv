import { useEffect, useState } from 'react';

import { subscribeToViewCounts, syncView } from '../services/gun-service';

export function useViewCounts() {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeToViewCounts((key, count) => {
      setViewCounts((prev) => ({ ...prev, [key]: count }));
    });

    return () => unsub();
  }, []);

  return { viewCounts, incrementView: syncView };
}
