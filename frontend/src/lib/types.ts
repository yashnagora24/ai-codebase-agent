export type Mode = "ask" | "fix";

export type AIResponse = {
  answer?: string;
  suggestion?: string;
  analysis?: string
  files_analyzed: number;
  relevant_files: string[];
  total_bytes?: number
  truncated: boolean;
};

export type ScanResponse = {
  folder: string;
  total_files_found: number;
  results_returned: number;
  truncated: boolean;
  files: {
    path: string;
    extension: string;
  }[];
};
