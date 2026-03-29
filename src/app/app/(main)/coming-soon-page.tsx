type Props = { title: string };

export function ComingSoonPage({ title }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Próximamente.</p>
      </div>
    </div>
  );
}
