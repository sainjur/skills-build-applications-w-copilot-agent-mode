import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardRow = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Unable to load leaderboard');
        const payload = await response.json();
        if (!cancelled) setLeaderboard(Array.isArray(payload.leaderboard) ? payload.leaderboard : []);
      } catch {
        if (!cancelled) setError('Unable to load leaderboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} emptyText="leaderboard">
      {leaderboard.length > 0 ? (
        <ul>
          {leaderboard.map((entry, index) => (
            <li key={`${entry.teamName ?? 'team'}-${index}`}>
              {entry.rank}. {entry.teamName} — {entry.totalPoints}
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
