from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
TARGETS = [
    ROOT / 'docker-compose.yml',
    ROOT / 'docker-compose.prod.yml',
    ROOT / '.github' / 'workflows' / 'deploy.yml',
    ROOT / '.github' / 'workflows' / 'deploy-hms.yml',
    ROOT / 'hms-backend' / 'scripts' / 'remote-deploy.sh',
]

BANNED_PATTERNS = {
    'auth bypass flag': re.compile(r'DISABLE_AUTH_VERIFICATION\s*[:=]\s*"?true"?', re.IGNORECASE),
    'default jwt secret': re.compile(r'super-secret-key', re.IGNORECASE),
    'default master mfa key': re.compile(r'super-secret-mfa-key', re.IGNORECASE),
    'default prod db password': re.compile(r'hms_secure_pass', re.IGNORECASE),
    'hard-coded dev postgres password': re.compile(r'POSTGRES_PASSWORD\s*:\s*postgres\b'),
    'hard-coded dev postgres db': re.compile(r'POSTGRES_DB\s*:\s*hms_db\b'),
    'hard-coded dev postgres user': re.compile(r'POSTGRES_USER\s*:\s*postgres\b'),
    'hard-coded sqlite-like test db url in runtime compose': re.compile(r'DATABASE_URL\s*:\s*postgresql://postgres:postgres@db:5432/hms_db\?schema=public', re.IGNORECASE),
}

failures: list[str] = []

for target in TARGETS:
    if not target.exists():
        continue
    text = target.read_text(encoding='utf-8')
    for label, pattern in BANNED_PATTERNS.items():
        for match in pattern.finditer(text):
            line = text.count('\n', 0, match.start()) + 1
            failures.append(f'{target.relative_to(ROOT)}:{line}: {label}')

if failures:
    print('Tracked runtime config violations found:')
    for failure in failures:
        print(f' - {failure}')
    sys.exit(1)

print('Runtime config guard passed.')
