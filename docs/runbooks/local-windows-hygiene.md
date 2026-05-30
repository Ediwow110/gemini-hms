# Local Windows Hygiene

This runbook documents known Windows-specific issues when working with this repository and how to avoid committing platform noise.

## CRLF Line-Ending Diffs

### The Problem

Git on Windows may convert LF (`\n`) to CRLF (`\r\n`) on checkout, causing shell scripts committed as LF to show as modified with no visible change. This creates persistent dirty working trees and risks accidental whitespace-only commits.

**Affected files:**
- `scripts/db-backup.sh`
- `scripts/db-restore.sh`
- `scripts/smoke-prod.sh`

### Check Your Git Config

```powershell
git config core.autocrlf
```

- `true` — Git converts LF → CRLF on checkout, CRLF → LF on commit. Usually fine for most projects, but shell scripts may show diffs.
- `input` — Git converts CRLF → LF on commit only. Preferred for cross-platform repos.
- `false` — No conversion. Files stay exactly as committed. Requires a consistent editor configuration.

For this repository (shell scripts should stay LF):

```powershell
git config core.autocrlf input
```

Or for a per-repo setting:

```powershell
git config --local core.autocrlf input
```

### How to Check for CRLF Diffs

```powershell
git diff --ignore-cr-at-eol
```

If the diff disappears with `--ignore-cr-at-eol`, the only change is line endings. Do not commit it.

### How to Run Shell Scripts on Windows

Always use `bash` explicitly. PowerShell does not execute `.sh` files natively.

```powershell
bash scripts/db-backup.sh
bash scripts/db-restore.sh
bash scripts/smoke-prod.sh
```

Do not double-click `.sh` files or run them via `.\script.sh` in PowerShell — this may invoke the wrong interpreter.

### Avoid Committing CRLF-Only Changes

Before committing shell scripts:

```powershell
git diff --check
```

This flags trailing whitespace and line-ending issues.

If a script must be fixed from CRLF to LF:

```powershell
# From the repo root
bash -c 'dos2unix scripts/db-backup.sh scripts/db-restore.sh scripts/smoke-prod.sh'
```

But do not normalize the entire repo in a single PR. Fix files as needed.

## Backup Artifacts

Backup files (`*.sql`, `*.dump`, `backups/`) are now in `.gitignore`.

If you create a backup:

```powershell
bash scripts/db-backup.sh
```

The output goes to `backups/` which is ignored. Verify:

```powershell
git status
# Should NOT show the backup file in "Changes not staged" or "Untracked"
```

## General Hygiene Checklist

Before committing on Windows:

```powershell
git status              # Check for unexpected modifications
git diff --check        # Check whitespace/CRLF
git diff --ignore-cr-at-eol  # Confirm CRLF is the only diff
```

If your working tree shows modified files you did not touch:

1. Check `git config core.autocrlf` — prefer `input` for this repo
2. Run `git diff --ignore-cr-at-eol` to confirm they are CRLF-only
3. Restore them with `git checkout -- <file>` if you did not change them
4. Do not commit CRLF-only changes
