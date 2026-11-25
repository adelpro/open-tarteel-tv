import { useEffect, useState } from 'react';

import { subscribeToViewCounts, syncView } from '../services/gun-service';
import { createCountBatcher, mergeCountEvents } from '../utils/count-batcher';

export function useViewCounts() {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    /* one state update per animation frame instead of one per GUN event */
    const batcher = createCountBatcher((events) => {
      setViewCounts((prev) => mergeCountEvents(prev, events));
    });

    const unsub = subscribeToViewCounts((key, count) => {
      batcher.push(key, count);
    });

    return () => {
      unsub();
      batcher.dispose();
    };
  }, []);

  return { viewCounts, incrementView: syncView };
}
