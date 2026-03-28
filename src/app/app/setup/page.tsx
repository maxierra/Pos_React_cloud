import { createBusiness } from "@/app/app/setup/actions";
import { SetupForm } from "@/app/app/setup/setup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SetupPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 items-center justify-center px-4 py-14">
      <Card className="w-full border-[var(--pos-border)] bg-[var(--pos-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Crear tu negocio</CardTitle>
          <CardDescription>
            Este contexto define el tenant. Todos los datos se aislarán por business.
          </CardDescription>
          {sp.error ? (
            <div className="text-sm text-destructive">{sp.error}</div>
          ) : null}
        </CardHeader>
        <CardContent>
          <SetupForm action={createBusiness} />
        </CardContent>
      </Card>
    </div>
  );
}
