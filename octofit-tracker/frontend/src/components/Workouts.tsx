import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title?: string; reason?: string; focus?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/workouts/suggestions/mona@example.com');
        if (!response.ok) throw new Error('Unable to load workouts');
        const payload = await response.json();
        if (!cancelled) setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
      } catch {
        if (!cancelled) setError('Unable to load workout suggestions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} emptyText="workout suggestions">
      {suggestions.length > 0 ? (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'workout'}-${index}`}>
              {suggestion.title} — {suggestion.reason ?? suggestion.focus ?? 'Recommended workout'}
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
