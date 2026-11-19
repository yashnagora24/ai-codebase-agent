import type { ReactNode } from "react";

export type AppShellProps = {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  footer: ReactNode;
};

export function AppShell({ header, sidebar, children, footer }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {header}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[336px_minmax(0,1fr)] lg:items-start">
          <div className="flex flex-col gap-5">{sidebar}</div>

          <div className="flex min-w-0 flex-col gap-5">{children}</div>
        </div>
      </main>

      {footer}
    </div>
  );
}
