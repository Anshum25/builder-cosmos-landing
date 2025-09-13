import type { LoadDataResponse, Permissions } from "@shared/api";

export interface LoadDataApiResponse {
  permissions: Permissions;
  data: LoadDataResponse;
  summary: {
    netWorth: number;
    spending: { total: number; top: { category: string; total: number }[]; months: number };
    unusual: null | { unusual: boolean; last: number; avgPrev: number; increasePct: number };
  };
}

export async function fetchLoadData(): Promise<LoadDataApiResponse> {
  const res = await fetch("/api/load-data");
  if (!res.ok) throw new Error("Failed to load data");
  return res.json();
}
