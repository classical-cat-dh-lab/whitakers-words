"""Export portable data tables from a verified reference build."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
from legacy import check_source, ROOT

parser = argparse.ArgumentParser()
parser.add_argument("--oracle", type=Path, required=True)
parser.add_argument("--toolchains", type=Path, required=True)
parser.add_argument("--write", action="store_true")
args = parser.parse_args()
work = args.oracle.resolve()
check_source(work)
toolchains = args.toolchains.resolve()
paths = [toolchains / "gnat-aarch64-darwin-15.3.0-1/bin", toolchains / "gprbuild-aarch64-darwin-25.0.0-1/bin"]
env = {**os.environ, "PATH": os.pathsep.join(map(str, paths)) + os.pathsep + os.environ["PATH"]}
project = work / "export_data.gpr"
project.write_text('with "words_engine.gpr";\nwith "support_utils.gpr";\nproject Export_Data is\n'
                   f' for Source_Dirs use ("{ROOT / "scripts/ada"}");\n'
                   ' for Main use ("dump_dictionary.adb", "dump_english.adb");\n'
                   ' for Object_Dir use "obj-export-data";\n for Exec_Dir use "bin";\nend Export_Data;\n')
subprocess.run([str(paths[1] / "gprbuild"), "-p", "-P", str(project)], cwd=work, env=env, check=True)
tables = {}
for executable, filename in (("dump_dictionary", "dictionary-forms.tsv"), ("dump_english", "english-index.tsv")):
    output = subprocess.check_output([str(work / "bin" / executable)], cwd=work, env=env)
    target = ROOT / "data" / filename
    if args.write:
        target.write_bytes(output)
    elif not target.exists() or target.read_bytes() != output:
        raise SystemExit(f"Derived data mismatch: {filename}")
    tables[filename] = {"sha256": hashlib.sha256(output).hexdigest(), "bytes": len(output), "rows": output.count(b"\n")}
lock = {"schemaVersion": 1, "snapshot": "words-mk270-1f2f0fb", "generator": "scripts/generate-data.py", "tables": tables}
if args.write:
    (ROOT / "data/derived.lock.json").write_text(json.dumps(lock, indent=2) + "\n")
else:
    assert json.loads((ROOT / "data/derived.lock.json").read_text()) == lock
check_source(work)
print(json.dumps(lock, indent=2))
