"use client";

import { useState, isValidElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css"
// @ts-expect-error react-syntax-highlighter does not provide TypeScript declarations.
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-expect-error react-syntax-highlighter does not provide TypeScript declarations for Prism styles.
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";


type Mode = "ask" | "fix";

type AIResponse = {
  answer?: string;
  suggestion?: string;
  analysis?: string
  files_analyzed: number;
  relevant_files: string[];
  total_bytes?: number
  truncated: boolean;
};

type ScanResponse = {
  folder: string;
  total_files_found: number;
  results_returned: number;
  truncated: boolean;
  files: {
    path: string;
    extension: string;
  }[];
};

function extractText(node: ReactNode): string {
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

function getFileLanguage(filePath: string): string {
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

export default function Home() {
  const [mode, setMode] = useState<Mode>("ask");
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState("")
  const [fileSize , setFileSize] = useState(0)
  const [fileQuestion, setFileQuestion] = useState("")
  const [fileAnalysis, setFileAnalysis] = useState("")
  const [fileAnalysisLoading, setFileAnalysisLoading] = useState(false)
  const [fileAnalysisError, setFileAnalysisError] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [connectedRepo, setConnectedRepo] = useState("")
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState("")
  const [analysisMode, setAnalysisMode] = useState(false)
const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
const [scanLoading, setScanLoading] = useState(false);
const [scanError, setScanError] = useState("");
  


  async function connectRepository() {
    if(!repoUrl.trim()){
      setRepoError("Please enter a GitHub repositroy URL.")
      return
    }

    setRepoLoading(true);
    setRepoError("")

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/download-repo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: repoUrl.trim(),
          }),
        }
      )

      const data = await response.json()

      if(!response.ok){
        throw new Error(
          data.detail || "Failed to connect repository."
        )
      }

      if (!data.workspace_id) {
        throw new Error("Workspace ID was not returned.")
      }

      setWorkspaceId(data.workspace_id)
      setConnectedRepo(data.repository_url || repoUrl.trim())

      setResult(null)
      setError("")
      setSelectedFile(null)
      setFileContent("")

    } catch (err) {
      setRepoError(
        err instanceof Error ? err.message : "Could not connect to backend."
      )
    } finally {
      setRepoLoading(false)
    }
  }


  async function analyzeRepository() {
    if (!workspaceId){
      setError("Please connect a GitHub repository first.")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)
    setAnalysisMode(true)
    
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
          })
        }
      )

      const data = await response.json()
      console.log("ANALYZE API RESPONSE:", data);
console.log("ANALYSIS TEXT:", data.analysis);

      if(!response.ok){
        throw new Error(
          data.detail || "Repository analysis failed."
        )
      }

      setResult(data)

    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not analyze repository."
      )
    } finally {
      setLoading(false)
    }
  }


  async function scanRepository() {
    if (!workspaceId){
      setScanError("Please connect a GitHub repository first.")
      return
    }

    setScanLoading(true)
    setScanError("")
    setScanResult(null)

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/scan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folder: ".",
            workspace_id: workspaceId,
          })
        }
      )

      const data = await res.json()

      if(!res.ok){
        throw new Error(data.detail || "Repository scanning failed.")
      }

      setScanResult(data)

    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Could not scan repository."
      )
    } finally{
      setScanLoading(false)
    }
  }


  async function submitRequest() {
    if (!question.trim()) {
      setError(
        mode === "ask"
          ? "Please enter a question first."
          : "Please describe the bug first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setAnalysisMode(false)

    const endpoint =
      mode === "ask" ? "/ask-ai" : "/suggest-fix";

    const requestBody =
      mode === "ask"
        ? { prompt: question, workspace_id: workspaceId,}
        : { bug_description: question, workspace_id: workspaceId };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      )

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wron.");
      }

      setResult({
        ...data,
        relevant_files: data.relevant_files ?? [],
        files_analyzed: data.files_analyzed ?? 0,
        truncated: data.truncated ?? false,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the backend."
      );
    } finally {
      setLoading(false)
    }

  }

  const responseText = result?.analysis || result?.answer || result?.suggestion || "";

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      alert("Failed to copy code.");
    }
  }

  async function openFile(file: string) {
    setSelectedFile(file);
    setFileContent("");
    setFileLoading(true);
    setFileError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/read-file",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: file,
            workspace_id: workspaceId,
          }),
        }
      )

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not read file")
      }

      setFileContent(data.content);
      setFileSize(data.size_bytes)

    } catch (err) {
      setFileError(
        err instanceof Error
          ? err.message
          : "Could not load file"
      )
    } finally {
      setFileLoading(false)
    }
  }

  async function analyzeSelectedFile() {
    if (!selectedFile || !fileQuestion.trim()) {
      setFileAnalysisError("Please enter a question.")
      return
    }

    setFileAnalysis("")
    setFileAnalysisError("")
    setFileAnalysisLoading(true)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-file",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: selectedFile,
            question: fileQuestion,
            workspace_id: workspaceId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "File analysis failed.")
      }

      setFileAnalysis(data.answer)
    } catch (err) {
      setFileAnalysisError(
        err instanceof Error ? err.message : "Something went wrong."
      )
    } finally {
      setFileAnalysisLoading(false)
    }
  }


  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
            AI-Powered Developer Tool
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AI Codebase <span className="text-cyan-400">Agent</span>
          </h1>

          <p className="mt-3 text-slate-400">
            Understand your codebase. Find files. Fix bugs.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Connect GitHub Repository
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter a public GitHub repository URL to analyze its code.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input type="url"
              value={repoUrl} 
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              disabled={repoLoading}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-50"
              />

              <button
                onClick={connectRepository}
                disabled={repoLoading || !repoUrl.trim()}
               className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
                {repoLoading ? "Connecting..." : "Connect Repository"}
              </button>
          </div>

          {repoError && (
            <p className="mt-3 text-sm text-red-400">
              {repoError}
            </p>
          )}

          {workspaceId && (
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-semibold text-green-400">
                 ✓ Repository Connected
              </p>

              <p className="mt-1 break-all text-sm text-slate-300">
                {connectedRepo}
              </p>
            </div>
          )}
        </section>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Repository File Explorer</h2>
              <p className="mt-1 text-sm text-slate-400">
                Scan your GitHub repository and browse its files.
              </p>
            </div>

            <button 
              onClick={scanRepository}
              disabled={!workspaceId || scanLoading}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scanLoading ? "Scanning..." : "Scan Repository"}
            </button>
          </div>

          {scanResult && (
            <div className="mt-5">
              <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-400">
                <p>
                  Total Files: <span className="text-cyan-400">{scanResult.total_files_found}</span>
                </p>
                <p>
                  Showing: <span className="text-cyan-400">{scanResult.results_returned}</span>
                </p>
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {scanResult.files.map((file) => (
                  <button 
                    key={file.path}
                    onClick={() => openFile(file.path)}
className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-left transition hover:border-cyan-500 hover:bg-slate-800"
          >
            <span className="break-all font-mono text-sm text-cyan-300">
              {file.path}
            </span>
            <span className="shrink-0 text-xs text-slate-500">
              {file.extension}
            </span>
          </button>
        ))}
      </div>

      {scanResult.truncated && (
        <p className="mt-3 text-sm text-amber-300">
          Some files are not displayed because of the scan limit.
        </p>
      )}
    </div>
  )}
</section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">

          <h2 className="mb-4 text-lg font-semibold">Choose an action</h2>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <button onClick={() => {
              setMode("ask");
              setResult(null);
              setError("");
            }}
              disabled={loading}
              className={`rounded-xl border p-4 text-left transition ${mode === "ask" ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"}`}
            >

              <span className="block font-semibold hover:cursor-pointer">Ask AI</span>
              <span className="mt-1 block text-xs">Ask questions about your code</span>

            </button>

            <button onClick={() => {
              setMode("fix");
              setResult(null);
              setError("");

            }}
              disabled={loading}
              className={`rounded-xl border p-4 text-left transition ${mode === "fix" ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500"}`}
            >
              <span className="block font-semibold">Suggest Fix</span>
              <span className="mt-1 block text-xs">
                Find bugs and suggest solutions
              </span>
            </button>
          </div>

            <button
              onClick={analyzeRepository}
              disabled= {loading || !workspaceId}
              className="mb-6 w-full rounded-xl border border-purple-500/10 p-4 text-purple-300 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block font-semibold">
                Analyze Repository →
              </span>

              <span className="mt-1 block text-xs text-slate-400">
                Get a complete AI analysis of your codebase
              </span>
            </button>

          <label
            htmlFor="question"
            className="mb-3 block text-sm font-medium text-slate-300"
          >
            {mode === "ask" ? "Ask a question about your codebase" : "Describe the bug"}

          </label>

          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !loading
              ) {
                event.preventDefault();
                submitRequest();
              }
            }}
            placeholder={
              mode === "ask" ? "Example: Where is repository scanning handled?" : "Example: My /read-file endpoint returns HTTP 400. find the cause and suggest a fix."
            }

            rows={4}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
          />


          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Press Enter to submit · Shift + Enter for a new line
            </p>

            <button
              onClick={submitRequest}
              disabled={loading}
              className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Processing..." : mode === "ask" ? "Ask AI →" : "Suggest Fix →"}
            </button>
          </div>
        </section>
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}
        {loading && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
            {mode === "ask" ? "Analyzing your codebase. Please wait..." : "Finding the bug and preparing a suggested fix..."}
          </div>
        )}

        {result && (
          <section className="mt-8 space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-semibold">
                {analysisMode ? "Repository Analysis" : mode === "ask" ? "AI Response" : "Suggested Fix"}
              </h2>

              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ children }) => {
                      const code = extractText(children)

                      const languageClass = isValidElement(children)
                        ? (children.props as { className?: string }).className
                        : undefined;

                      const language = languageClass?.match(/language-([\w-]+)/)?.[1];

                      const languageLabel = language
                        ? language.charAt(0).toUpperCase() + language.slice(1)
                        : "Code";

                      return (
                        <div className="relative my-4 overflow-hidden rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
                            <span className="text-xs font-semibold text-cyan-400">
                              {languageLabel}
                            </span>

                            <button
                              onClick={() => copyCode(code)}
                              className="rounded-md bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-600"
                            >
                              Copy
                            </button>
                          </div>

                          <pre className="overflow-x-auto bg-gray-950 p-4 text-sm">
                            {children}
                          </pre>
                        </div>
                      );
                    },

                    code: ({ children, className, ...props }) => {
                      const isCodeBlock = Boolean(className);

                      return (
                        <code className={isCodeBlock ? className : "rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300"} {...props}>
                          {children}
                        </code>

                      )
                    },

                  }}>
                  {responseText}
                </ReactMarkdown>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              {analysisMode ? (
                <>
                  <h2 className="text-lg font-semibold">
                    Repository Statistics
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-950 p-4">
                      <p className="text-sm text-slate-400">Files Analyzed</p>
                      <p className="mt-2 text-2xl font-bold text-cyan-400">
                        {result.files_analyzed}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-4">
                      <p className="text-sm text-slate-400">Repository Size</p>
                      <p className="mt-2 text-2xl font-bold text-cyan-400">
                        {((result.total_bytes ?? 0) / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">
                    Relevant Files
                  </h2>

              <p className="mt-1 text-sm text-slate-400">
                {result.files_analyzed} files included in AI context
              </p>

              {(result.relevant_files ?? []).length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {(result.relevant_files ?? []).map((file) => (
                    <li key={file}>
                      <button onClick={() => openFile(file)} className="w-full break-all rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-left font-mono text-sm text-cyan-300 transition hover:border-cyan-500 hover:bg-slate-800">
                        {file}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No relevant files were returned.
                </p>
              )}
              </>
        )}

              {result.truncated && (
                <p className="mt-4 text-sm text-amber-300">
                  Note: Some repository content was truncated.
                </p>
              )}
            </div>

            {selectedFile && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-white">
                      File Viewer
                    </h2>

                    <p className="mt-1 break-all text-xs text-cyan-400">
                      {selectedFile}
                    </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-cyan-400">
                      {getFileLanguage(selectedFile).toUpperCase()}
                    </span>

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                      {(fileSize / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  </div>
                  <div>
                    <button
                    onClick={() => copyCode(fileContent)}
                    disabled={fileLoading || !fileContent}
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-sm text-white transition hover:bg-cyan-500 disabled:opacity-50 m-2">
                      Copy
                    </button>

                    <button onClick={() => {
                      setSelectedFile(null);
                      setFileContent("")
                      setFileError("")
                      setFileSize(0)
                    }}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">
                      Close
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {fileLoading ? (
                    <p className="text-sm text-slate-400">
                      Loading file...
                    </p>
                  ) : fileError ? (
                    <p className="text-sm text-slate-400">{fileError}</p>
                  ) : (
                    <SyntaxHighlighter
                      language={getFileLanguage(selectedFile)}
                      style={vscDarkPlus}
                      showLineNumbers={true}
                      wrapLongLines={true}
                      customStyle={{
                        margin: 0,
                        padding: "16px",
                        background: "#030712",
                        fontSize: "13px",
                        maxHeight: "600px",
                        borderRadius: "8px",
                      }}
                      lineNumberStyle={{
                        color: "#64748b",
                        minWidth: "3em",
                        paddingRight: "1em",
                      }}
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  )}

                  <div className="mt-6 border-t border-slate-700 pt-6">
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      AI File Analysis
                    </h3>

                    <textarea value={fileQuestion} onChange={(e) => setFileQuestion(e.target.value)} placeholder="Ask something about this file..." rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-cyan-500"/>

                      <button 
                      onClick={analyzeSelectedFile}
                      disabled={fileAnalysisLoading || !fileQuestion.trim() || fileLoading}
                      className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
                      >
                        {fileAnalysisLoading ? "Analyzing..." : "Analyze File"}
                      </button>
                      {fileAnalysisError && (
                        <p className="mt-3 text-sm text-red-400">
                          {fileAnalysisError}
                        </p>
                      )}

                      {fileAnalysis && (
                        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                          <h4 className="mb-3 font-semibold text-cyan-400">
                            AI Response
                          </h4>

                          <div className="prose prose-invert max-w-none text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {fileAnalysis}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}

                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="mt-12 text-center text-sm text-slate-600">
          AI Codebase Agent · Built with Next.js and FastAPI
        </footer>
      </div>
    </main>
  );
}