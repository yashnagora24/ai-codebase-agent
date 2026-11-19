import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { SectionCard } from "@/components/ui/SectionCard";
import { TerminalIcon } from "@/components/ui/icons";

export type ResultPanelProps = {
  title: string;
  children: ReactNode;
};

export function ResultPanel({ title, children }: ResultPanelProps) {
  return (
    <SectionCard
      eyebrow="Output"
      icon={<TerminalIcon />}
      title={title}
      actions={<Badge tone="accent">Markdown</Badge>}
    >
      <div className="md-body">{children}</div>
    </SectionCard>
  );
}
