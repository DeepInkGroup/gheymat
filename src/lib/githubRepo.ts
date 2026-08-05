const OWNER = process.env.GH_REPO_OWNER || "DeepInkGroup";
const REPO = process.env.GH_REPO_NAME || "Gheymat";
const BRANCH = process.env.GH_REPO_BRANCH || "main";
const API = "https://api.github.com";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.GH_COMMIT_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function isGithubCommitConfigured(): boolean {
  return !!process.env.GH_COMMIT_TOKEN;
}

/** Fetches and JSON-parses a file straight from GitHub's current HEAD (not the local deploy bundle), so a write always merges against the true latest committed state. */
export async function fetchJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const decoded = Buffer.from(json.content, "base64").toString("utf8");
    return JSON.parse(decoded) as T;
  } catch {
    return fallback;
  }
}

/**
 * Commits multiple files in a single atomic commit via the Git Data API
 * (blobs -> tree -> commit -> ref update), so one snapshot run triggers
 * exactly one Vercel deploy instead of one per file.
 */
export async function commitFiles(files: Array<{ path: string; content: unknown }>, message: string): Promise<boolean> {
  if (!isGithubCommitConfigured()) return false;
  const headers = authHeaders();

  try {
    const refRes = await fetch(`${API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, { headers, cache: "no-store" });
    if (!refRes.ok) return false;
    const latestCommitSha = (await refRes.json()).object.sha as string;

    const commitRes = await fetch(`${API}/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`, {
      headers,
      cache: "no-store",
    });
    if (!commitRes.ok) return false;
    const baseTreeSha = (await commitRes.json()).tree.sha as string;

    const blobs = await Promise.all(
      files.map(async (f) => {
        const res = await fetch(`${API}/repos/${OWNER}/${REPO}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: JSON.stringify(f.content, null, 2), encoding: "utf-8" }),
        });
        if (!res.ok) throw new Error(`blob create failed for ${f.path}`);
        const json = await res.json();
        return { path: f.path, sha: json.sha as string };
      })
    );

    const treeRes = await fetch(`${API}/repos/${OWNER}/${REPO}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: blobs.map((b) => ({ path: b.path, mode: "100644", type: "blob", sha: b.sha })),
      }),
    });
    if (!treeRes.ok) return false;
    const newTreeSha = (await treeRes.json()).sha as string;

    const newCommitRes = await fetch(`${API}/repos/${OWNER}/${REPO}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, tree: newTreeSha, parents: [latestCommitSha] }),
    });
    if (!newCommitRes.ok) return false;
    const newCommitSha = (await newCommitRes.json()).sha as string;

    const updateRefRes = await fetch(`${API}/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitSha }),
    });
    return updateRefRes.ok;
  } catch {
    return false;
  }
}
