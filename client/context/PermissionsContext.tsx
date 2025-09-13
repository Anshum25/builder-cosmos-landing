import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Permissions } from "@shared/api";
import { toast } from "sonner";

interface Ctx {
  permissions: Permissions;
  setPermission: (key: keyof Permissions, value: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const defaultPerms: Permissions = {
  assets: false,
  liabilities: false,
  transactions: false,
  epf: false,
  creditScore: false,
  investments: false,
};

const PermissionsContext = createContext<Ctx | null>(null);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permissions>(defaultPerms);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const res = await fetch("/api/permissions");
    const data = (await res.json()) as Permissions;
    setPermissions(data);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const setPermission = async (key: keyof Permissions, value: boolean) => {
    const next = { ...permissions, [key]: value };
    setPermissions(next);
    const res = await fetch("/api/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (!res.ok) {
      toast.error("Failed to update permissions");
      await refresh();
      return;
    }
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase());
    toast(value ? `Access to ${label} Granted` : `Access to ${label} Revoked`);
  };

  const value = useMemo<Ctx>(
    () => ({ permissions, setPermission, refresh, loading }),
    [permissions, loading],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
};
