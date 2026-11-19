import { isValidElement, type ReactNode } from "react";

export function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("")
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children)
  }

  return "";
}

export function getFileLanguage(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLocaleLowerCase();

  const languages: Record<string, string> = {
    py: "python",
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    json: "json",
    css: "css",
    html: "markup",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    sh: "bash",
  }

  return languages[extension ?? ""] || "text"
}
