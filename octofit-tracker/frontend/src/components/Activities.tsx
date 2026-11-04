import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/activities');
        if (!response.ok) throw new Error('Unable to load activities');
        const payload = await response.json();
        if (!cancelled) setActivities(Array.isArray(payload.activities) ? payload.activities : []);
      } catch {
        if (!cancelled) setError('Unable to load activities.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error} emptyText="activities">
      {activities.length > 0 ? (
        <ul>
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`}>
              {activity.type} · {activity.minutes ?? 0} minutes · {activity.points ?? 0} pts
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
