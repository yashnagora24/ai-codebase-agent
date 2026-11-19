import { ChevronRightIcon, FileCodeIcon } from "@/components/ui/icons";

export type FileRowProps = {
  path: string;
  extension: string;
  onClick: () => void;
};

export function FileRow({ path, extension, onClick }: FileRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-line/70 bg-ink/40 px-3 py-2.5 text-left transition-colors duration-200 hover:border-accent/40 hover:bg-raised/60 focus-visible:border-accent"
    >
      <FileCodeIcon className="size-4 shrink-0 text-faint transition-colors group-hover:text-accent" />

      <span className="min-w-0 flex-1 break-all font-mono text-[12px] leading-relaxed text-muted transition-colors group-hover:text-fg">
        {path}
      </span>

      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-faint">
        {extension}
      </span>

      <ChevronRightIcon className="size-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
