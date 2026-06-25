---
description: Security-scan, push to GitHub, deploy GitHub Pages, and sync README + repo About/live-site
---

You are running the **/githubupdate** workflow for this repository. Execute the steps **in order**. This is a vanilla HTML/CSS/JS site (no build step) deployed to GitHub Pages. Do not introduce frameworks, package managers, or build tooling.

If any step fails, **stop and report** rather than forcing past it — especially the security scan (step 1).

## 0. Preflight

- Run `git status` and `git rev-parse --abbrev-ref HEAD` to see the working tree and current branch.
- Run `git remote -v` and `gh repo view --json nameWithOwner,url,homepageUrl,description 2>/dev/null` to confirm the GitHub remote and capture the current About/homepage. If there is no remote or `gh` is not authenticated, report that and stop.

## 1. Security scan (BLOCKING — do this before anything is pushed)

Scan everything that would be committed/pushed for sensitive information. Treat any real finding as a hard stop.

- Inspect tracked + staged + untracked files (`git status`, `git diff`, `git ls-files`). Pay attention to what is NOT gitignored.
- Grep the working tree for secret-shaped content: API keys, tokens, passwords, private keys (`BEGIN ... PRIVATE KEY`), `.env` files, AWS/GCP/Azure credentials, bearer tokens, connection strings, `Authorization:` headers, OAuth secrets, webhook URLs with tokens.
- Confirm no credential, key, or non-public file is tracked. `.env`, `*.pem`, `*.key`, secrets files, and local config must be gitignored and NOT staged.
- **Project-specific:** the only intentionally-public address is the `FORMSUBMIT_EMAIL` constant in [script.js](script.js) (a contact address, public by design — not a secret). Flag any OTHER email/credential that looks accidental. Do not treat `FORMSUBMIT_EMAIL` as a leak.
- If you find anything sensitive: **stop, do not push**, list each finding with file + line, and recommend remediation (remove, gitignore, rotate). Only continue once the user confirms it's clean or removes it.

If the scan is clean, say so explicitly and continue.

## 2. Create / update README

- If `README.md` is missing, create one; otherwise update it so it stays accurate.
- It should cover: what the site is, the three-file structure (`index.html`, `styles.css`, `script.js`), how to run/preview locally (`open index.html` or `python3 -m http.server`), that there is no build step, and the live GitHub Pages URL (fill in once known from step 4).
- Keep it concise and truthful to the actual code — do not document features that don't exist.

## 3. Ensure GitHub Pages deploy via GitHub Actions

- Check for a Pages workflow under `.github/workflows/`. If one already exists (e.g. a deploy-pages workflow), leave it unless it's broken.
- If none exists, add a minimal GitHub Actions workflow that publishes the repo root to GitHub Pages on push to the default branch, using `actions/upload-pages-artifact` + `actions/deploy-pages` with the standard `pages: write` / `id-token: write` permissions and a `github-pages` environment.
- Make sure Pages is configured to build from **GitHub Actions** (not a branch). If needed: `gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow` (or update via `-X PUT`), tolerating "already exists".

## 4. Commit and push

- Run `node --check script.js` as a sanity check if JS changed.
- Stage the changes, write a clear commit message describing what changed (README, workflow, etc.), and append the required trailer:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
- Push to the default branch's remote. Then watch the deploy: `gh run watch` (or `gh run list` / `gh run view`) until the Pages workflow succeeds. Report the run result.

## 5. Update repo About + live site link

- Determine the live URL from the Pages config: `gh api repos/{owner}/{repo}/pages --jq .html_url` (typically `https://<owner>.github.io/<repo>/`).
- Set the repository homepage to the live URL and ensure a sensible description:
  ```
  gh repo edit --homepage "<live-url>" --description "<short description of the site>"
  ```
- Optionally add relevant topics with `gh repo edit --add-topic`.
- If step 2's README used a placeholder for the live URL, update it now with the real URL and push that follow-up change.

## 6. Final report

Summarize: security-scan result, what was committed/pushed, the deploy run status, the live URL, and the updated repo About/homepage. Surface anything skipped or that needs the user's attention (e.g. FormSubmit activation, Pages still building).
