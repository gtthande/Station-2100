import React, { useEffect, useState } from "react";
import { useAdminGuard } from "../../lib/auth/useAdminGuard";

type CommitInfo = {
  sha?: string;
  author?: string;
  message?: string;
  date?: string;
  html_url?: string;
  error?: string;
};

function copyToClipboard(txt: string) {
  navigator.clipboard.writeText(txt);
}

export default function DevToolsClient() {
  const { user, loading } = useAdminGuard();
  const [commit, setCommit] = useState<CommitInfo | null>(null);
  const [commitLoading, setCommitLoading] = useState(true);
  const repo = import.meta.env.VITE_GITHUB_REPO || "gtthande/Station-2100";

  useEffect(() => {
    (async () => {
      try {
        // Using GitHub API directly since we are in Vite
        const token = import.meta.env.VITE_GITHUB_TOKEN;
        const headers: HeadersInit = { "Accept": "application/vnd.github+json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const r = await fetch(
          `https://api.github.com/repos/${repo}/commits?sha=main&per_page=1`,
          { headers, cache: "no-store" }
        );
        
        if (r.ok) {
          const data = await r.json();
          const c = data?.[0];
          setCommit({
            sha: c?.sha,
            author: c?.commit?.author?.name,
            message: c?.commit?.message,
            date: c?.commit?.author?.date,
            html_url: c?.html_url,
          });
        } else {
          setCommit({ error: `GitHub API error: ${r.status}` });
        }
      } catch (error) {
        setCommit({ error: `Network error: ${error}` });
      } finally {
        setCommitLoading(false);
      }
    })();
  }, [repo]);

  if (loading) return <div className="p-6">Loading admin check...</div>;
  if (!user) return <div className="p-6">Access denied</div>;

  const psUp = `git-sync-up "Describe your change"`;
  const psDown = `git-sync-down`;
  const psPlainUp = `git add . && git commit -m "Describe your change" && git push origin main`;
  const psPlainDown = `git pull origin main`;

  const bashUp = `git-sync-up "Describe your change"`;
  const bashDown = `git-sync-down`;
  const bashPlainUp = `git add . && git commit -m "Describe your change" && git push origin main`;
  const bashPlainDown = `git pull origin main`;

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold">Dev Sync Panel</h1>
      <p className="text-sm text-gray-600">
        Safely sync <b>Cursor</b> and <b>Lovable</b> via GitHub. Copy these commands into each environment's terminal.
      </p>

      <section className="rounded-2xl border p-5 space-y-2">
        <h2 className="font-semibold">Latest on <code>main</code> {repo ? `(${repo})` : ""}</h2>
        {commitLoading ? (
          <div>Loadingâ€¦</div>
        ) : commit?.error ? (
          <div className="text-red-600 text-sm">Error: {commit.error}</div>
        ) : (
          <div className="text-sm">
            <div><b>Message:</b> {commit?.message}</div>
            <div><b>Author:</b> {commit?.author}</div>
            <div><b>Date:</b> {commit?.date ? new Date(commit.date).toLocaleString() : "-"}</div>
            <div className="truncate"><b>SHA:</b> {commit?.sha}</div>
            {commit?.html_url && (
              <a className="text-blue-600 underline" href={commit.html_url} target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            )}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 space-y-3">
          <h3 className="font-semibold">Cursor (PowerShell)</h3>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 p-2 rounded">{psDown}</code>
            <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(psDown)}>Copy</button>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 p-2 rounded">{psUp}</code>
            <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(psUp)}>Copy</button>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer">Plain git (no functions)</summary>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-gray-100 p-2 rounded">{psPlainDown}</code>
              <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(psPlainDown)}>Copy</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-gray-100 p-2 rounded">{psPlainUp}</code>
              <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(psPlainUp)}>Copy</button>
            </div>
          </details>
        </div>

        <div className="rounded-2xl border p-4 space-y-3">
          <h3 className="font-semibold">Lovable (Bash)</h3>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 p-2 rounded">{bashDown}</code>
            <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(bashDown)}>Copy</button>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-gray-100 p-2 rounded">{bashUp}</code>
            <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(bashUp)}>Copy</button>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer">Plain git (no functions)</summary>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-gray-100 p-2 rounded">{bashPlainDown}</code>
              <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(bashPlainDown)}>Copy</button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs bg-gray-100 p-2 rounded">{bashPlainUp}</code>
              <button className="px-2 py-1 border rounded" onClick={() => copyToClipboard(bashPlainUp)}>Copy</button>
            </div>
          </details>
        </div>
      </section>

      <section className="rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold">Environment Setup</h3>
        <p className="text-sm text-gray-600">
          Add these to your <code>.env</code> file:
        </p>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          VITE_GITHUB_REPO=gtthande/Station-2100<br/>
          # VITE_GITHUB_TOKEN=ghp_xxx (optional for public repos)
        </div>
      </section>
    </div>
  );
}
