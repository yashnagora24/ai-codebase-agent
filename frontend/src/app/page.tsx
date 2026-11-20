"use client";

import { useEffect, useRef, useState } from "react";

import type { Mode, AIResponse, ScanResponse } from "@/lib/types";

import { AppShell } from "@/components/layout/AppShell";
import { Footer } from "@/components/layout/Footer";
import { TopBar } from "@/components/layout/TopBar";
import { RepoConnector } from "@/components/repo/RepoConnector";
import { FileExplorer } from "@/components/explorer/FileExplorer";
import { ActionPanel } from "@/components/actions/ActionPanel";
import { ResultPanel } from "@/components/results/ResultPanel";
import { MarkdownContent } from "@/components/results/MarkdownContent";
import { AnalysisStats } from "@/components/results/AnalysisStats";
import { RelevantFiles } from "@/components/results/RelevantFiles";
import { CodeViewer } from "@/components/viewer/CodeViewer";
import { FileAIPanel } from "@/components/viewer/FileAIPanel";
import { Alert } from "@/components/ui/Alert";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

const API_BASE = "/api/backend";

function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function apiFetch(path: string, init: RequestInit) {
  try {
    return await fetch(apiUrl(path), init);
  } catch {
    throw new Error(
      "The backend is starting up or unavailable. Please try again in a moment."
    );
  }
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
      const response = await apiFetch(
        "/download-repo",
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
      const response = await apiFetch(
        "/analyze",
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
      const res = await apiFetch(
        "/scan",
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
      const response = await apiFetch(
        endpoint,
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
      return true;
    } catch {
      alert("Failed to copy code.");
      return false;
    }
  }

  async function openFile(file: string) {
    setSelectedFile(file);
    setFileContent("");
    setFileLoading(true);
    setFileError("");

    try {
      const response = await apiFetch(
        "/read-file",
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
      const response = await apiFetch(
        "/analyze-file",
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

  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    const node = viewerRef.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    node.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [selectedFile]);


  return (
    <AppShell
      header={
        <TopBar workspaceId={workspaceId} connectedRepo={connectedRepo} />
      }
      footer={<Footer />}
      sidebar={
        <>
          <RepoConnector
            repoUrl={repoUrl}
            onUrlChange={setRepoUrl}
            onConnect={connectRepository}
            repoLoading={repoLoading}
            repoError={repoError}
            workspaceId={workspaceId}
            connectedRepo={connectedRepo}
          />

          <FileExplorer
            scanResult={scanResult}
            scanLoading={scanLoading}
            workspaceId={workspaceId}
            onScan={scanRepository}
            onOpenFile={openFile}
          />
        </>
      }
    >
      <ActionPanel
        mode={mode}
        question={question}
        loading={loading}
        workspaceId={workspaceId}
        onSelectAsk={() => {
          setMode("ask");
          setResult(null);
          setError("");
        }}
        onSelectFix={() => {
          setMode("fix");
          setResult(null);
          setError("");

        }}
        onAnalyze={analyzeRepository}
        onQuestionChange={setQuestion}
        onQuestionKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !loading
          ) {
            event.preventDefault();
            submitRequest();
          }
        }}
        onSubmit={submitRequest}
      />

      {selectedFile && (
        <div ref={viewerRef} className="scroll-mt-24">
          <CodeViewer
            selectedFile={selectedFile}
            fileContent={fileContent}
            fileLoading={fileLoading}
            fileError={fileError}
            fileSize={fileSize}
            onCopy={() => copyCode(fileContent)}
            onClose={() => {
              setSelectedFile(null);
              setFileContent("")
              setFileError("")
              setFileSize(0)
            }}
          >
            <FileAIPanel
              fileQuestion={fileQuestion}
              onFileQuestionChange={setFileQuestion}
              onAnalyzeFile={analyzeSelectedFile}
              fileAnalysis={fileAnalysis}
              fileAnalysisLoading={fileAnalysisLoading}
              fileAnalysisError={fileAnalysisError}
              fileLoading={fileLoading}
            />
          </CodeViewer>
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {loading && (
        <LoadingPanel
          title={
            mode === "ask"
              ? "Analyzing your codebase. Please wait..."
              : "Finding the bug and preparing a suggested fix..."
          }
        />
      )}

      {result && (
        <section className="space-y-5">
          <ResultPanel
            title={
              analysisMode
                ? "Repository Analysis"
                : mode === "ask"
                  ? "AI Response"
                  : "Suggested Fix"
            }
          >
            <MarkdownContent content={responseText} onCopyCode={copyCode} />
          </ResultPanel>

          {analysisMode ? (
            <AnalysisStats result={result} />
          ) : (
            <RelevantFiles result={result} onOpenFile={openFile} />
          )}
        </section>
      )}
    </AppShell>
  );
}
