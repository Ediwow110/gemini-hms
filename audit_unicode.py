from pathlib import Path
roots = [
    'hms-backend/prisma',
    'hms-backend/src/patients',
    'hms-backend/src/encounters',
    'hms-backend/src/clinical',
    'hms-backend/src/lab',
    'hms-backend/src/orders',
    'hms-backend/src/billing',
    'hms-backend/src/audit',
    'docs',
]
bad = []
for root in roots:
    p = Path(root)
    if not p.exists():
        continue
    for child in p.rglob('*'):
        if not child.is_file():
            continue
        if child.suffix not in {'.ts', '.sql', '.prisma', '.md', '.json'}:
            continue
        text = child.read_text(encoding='utf-8', errors='replace')
        for i, ch in enumerate(text):
            if ord(ch) in list(range(0x202A, 0x202F)) + list(range(0x2066, 0x2070)):
                bad.append((str(child), i, hex(ord(ch))))
print(bad)
