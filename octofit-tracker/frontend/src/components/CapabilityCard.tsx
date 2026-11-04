type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  children?: React.ReactNode;
};

export function CapabilityCard({ title, description, loading = false, error = null, emptyText, children }: Props) {
  if (loading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><div role="alert">{error}</div></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{children ?? (emptyText ? <p>No {emptyText}.</p> : null)}</div></section>;
}
