import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = { name?: string; members?: Array<string | { toString(): string }> };

export default function Teams() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Unable to load teams');
        const payload = await response.json();
        if (!cancelled) setTeams(Array.isArray(payload.teams) ? payload.teams : []);
      } catch {
        if (!cancelled) setError('Unable to load teams.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} emptyText="teams">
      {teams.length > 0 ? (
        <ul>
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`}>
              {team.name} · {team.members?.length ?? 0} members
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
