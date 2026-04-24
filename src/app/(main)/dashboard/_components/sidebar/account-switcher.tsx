"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Check, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";

export function AccountSwitcher({
  accounts,
  activeAccountId,
}: {
  readonly accounts: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly segment: string;
  }>;
  readonly activeAccountId?: string;
}) {
  const router = useRouter();
  const [activeAccount, setActiveAccount] = useState(
    accounts.find((account) => account.id === activeAccountId) ?? accounts[0],
  );
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  useEffect(() => {
    setActiveAccount(accounts.find((account) => account.id === activeAccountId) ?? accounts[0]);
  }, [accounts, activeAccountId]);

  const switchAccount = async (accountId: string) => {
    if (!accountId || accountId === activeAccount?.id) {
      return;
    }

    setSwitchingAccountId(accountId);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rmId: accountId }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to switch account");
      }

      toast.success(`Switched to ${result.data.rm.name}`);
      window.dispatchEvent(
        new CustomEvent("rm-account-switched", {
          detail: { rmId: result.data.rm.id },
        }),
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch account");
    } finally {
      setSwitchingAccountId(null);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  if (!activeAccount) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg">{getInitials(activeAccount.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            className={cn("p-0", account.id === activeAccount.id && "border-l-2 border-l-primary bg-accent/50")}
            onClick={() => switchAccount(account.id)}
          >
            <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="rounded-lg">{getInitials(account.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{account.name}</span>
                <span className="truncate text-xs">{account.segment}</span>
              </div>
              {switchingAccountId === account.id ? <span className="text-xs text-muted-foreground">...</span> : null}
              {account.id === activeAccount.id ? <Check className="size-4 text-primary" /> : null}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
