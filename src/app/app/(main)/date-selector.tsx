"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function DateSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDate = searchParams?.get("date") ?? "";

  const [date, setDate] = useState(currentDate);

  useEffect(() => {
    setDate(searchParams?.get("date") ?? "");
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="dashboard-date" className="text-sm font-medium text-muted-foreground">
        Fecha:
      </label>
      <input
        id="dashboard-date"
        type="date"
        value={date}
        onChange={handleChange}
        className="flex h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
