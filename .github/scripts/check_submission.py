import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

API = "https://api.github.com"
FOLDER_RE = re.compile(r"^submissions/([^/]+)/[^/]+$")


def first_url(text, label):
    """First http(s) URL on the list line that starts with `label`, or None."""
    m = re.search(rf"^\s*-\s*{re.escape(label)}\b.*?(https?://[^\s<>\"]+)", text, re.M | re.I)
    return m.group(1).rstrip(").,") if m else None


def call(url, accept="application/vnd.github+json"):
    req = urllib.request.Request(url, headers={
        "Accept": accept,
        "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "craft-n-code-check",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.headers, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.headers, ""


def get_json(path):
    status, headers, body = call(API + path)
    return status, headers, (json.loads(body) if status == 200 and body else None)


def when(s):
    return datetime.fromisoformat(s)


def main():
    repo, pr_no = os.environ["REPO"], os.environ["PR_NUMBER"]
    deadline = when(os.environ["DEADLINE"])
    errors = []

    _, _, pr = get_json(f"/repos/{repo}/pulls/{pr_no}")
    head_repo, head_sha = pr["head"]["repo"]["full_name"], pr["head"]["sha"]

    # 1. Every changed file sits in one team folder, and submission.md is there.
    _, _, files = get_json(f"/repos/{repo}/pulls/{pr_no}/files?per_page=100")
    names = [f["filename"] for f in files]
    folders = {m.group(1) for n in names if (m := FOLDER_RE.match(n))}
    stray = [n for n in names if not FOLDER_RE.match(n)]
    folder = next(iter(folders)) if len(folders) == 1 else None
    if stray:
        errors.append("Only files directly inside submissions/<team-name>/ are allowed. Remove or move these: " + ", ".join(stray))
        folder = None
    elif len(folders) != 1:
        errors.append("Your files are in more than one folder. Keep everything in one folder named after your team.")
        folder = None
    elif folder == "_TEMPLATE":
        errors.append("Rename the _TEMPLATE folder to your team name.")
        folder = None
    elif f"submissions/{folder}/submission.md" not in names:
        errors.append(f"Add a file named submission.md inside submissions/{folder}/.")
        folder = None

    # 2. Last commit before the deadline.
    _, _, commits = get_json(f"/repos/{repo}/pulls/{pr_no}/commits?per_page=100")
    last = max(when(c["commit"]["committer"]["date"]) for c in commits)
    if last > deadline:
        ist = timezone(timedelta(hours=5, minutes=30))
        errors.append(f"Your latest commit was made at {last.astimezone(ist):%d %b %I:%M %p} IST, after the deadline of {deadline.astimezone(ist):%d %b %I:%M %p} IST.")

    if folder is None:
        return report(errors)

    # 3. Read submission.md from the PR head, as plain text.
    path = urllib.parse.quote(f"submissions/{folder}/submission.md")
    status, _, text = call(f"{API}/repos/{head_repo}/contents/{path}?ref={head_sha}", "application/vnd.github.raw+json")
    if status != 200:
        errors.append("submission.md could not be read. Check that it is committed and pushed to your branch.")
        return report(errors)

    # 4. Links.
    code_url = first_url(text, "Code repository")
    video_url = first_url(text, "Demo video")
    slides_url = first_url(text, "Slides")
    for label, url in (("Code repository", code_url), ("Demo video", video_url), ("Slides", slides_url)):
        if not url:
            errors.append(f"{label} link is missing. Paste the URL on the \"{label}\" line in submission.md.")

    return report(errors)


def report(errors):
    lines = ["## Submission check", ""]
    lines += [f"- {e}" for e in errors]
    if not errors:
        lines.insert(2, "- All checks passed.")
    for e in errors:
        print(f"::error::{e}")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
