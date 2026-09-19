"""Extract ordered tables from the immutable Ada archive; never infer new rules."""
import hashlib
import json
from pathlib import Path
import re
import tarfile

ROOT = Path(__file__).resolve().parents[1]
lock = json.loads((ROOT / "legacy.lock.json").read_text())
archive = ROOT / "vendor/legacy/words-mk270-1f2f0fb.tar.gz"
assert hashlib.sha256(archive.read_bytes()).hexdigest() == "9fae6c316fb299bbb27f7512d405ee03edecaeb82867a8134a7804677c6c0182"
tables = {}
with tarfile.open(archive) as tf:
    for extension in ("ads", "adb"):
        member = next(m for m in tf.getmembers() if m.name.endswith("words_engine-trick_tables." + extension))
        source = re.sub(r"--[^\n]*", "", tf.extractfile(member).read().decode())
        for name, body in re.findall(r"(\w+)\s*:\s*constant TricksT := \((.*?)\n\s*\);", source, re.S):
            rows = []
            for row in re.findall(r"\(Max => (.*?)\)", body, re.S):
                maximum, operation = re.match(r"(\d+),\s*Op => TC_(\w+)", row).groups()
                values = re.findall(r'=>\s*\+"([^"]*)"', row)
                rows.append([operation, *values, int(maximum)])
            tables[name] = rows
assert len(tables) == 26
target = ROOT / "src/trick-tables.ts"
target.write_text("// Ordered legacy tables. Rebuild with scripts/generate-tricks.py.\n"
                  "// Source notice: licenses/whitaker.txt.\n"
                  "export type Trick = [string, string, string | number, number?];\n"
                  "export const TABLES: Record<string, Trick[]> = " + json.dumps(tables, indent=2) + ";\n")
