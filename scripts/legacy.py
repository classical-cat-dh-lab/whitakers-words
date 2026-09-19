#!/usr/bin/env python3
"""Build and verify the fixed Ada reference without modifying host configuration."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
LOCK = json.loads((ROOT / "legacy.lock.json").read_text())
FIXTURES = ROOT / "tests/legacy"
DATA_FILES = ("DICTFILE.GEN", "STEMFILE.GEN", "INDXFILE.GEN", "EWDSFILE.GEN", "INFLECTS.SEC", "ADDONS.LAT", "UNIQUES.LAT")


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def upstream_view(raw):
    # Exactly the pinned test/ignore-top-and-tail: sed '1,18 d; $ d'.
    lines = raw.split(b"\n")
    if lines and lines[-1] == b"":
        lines.pop()
    return b"\n".join(lines[18:-1]) + b"\n"


def diff_view(raw):
    # Upstream diff -Z --strip-trailing-cr, retaining empty lines and order.
    return [line.rstrip(b" \t\r\v\f") for line in raw.split(b"\n")]


def acquire_tools(toolchains, downloads):
    lock = json.loads((ROOT / "toolchains.lock.json").read_text())
    downloads.mkdir(parents=True, exist_ok=True)
    toolchains.mkdir(parents=True, exist_ok=True)
    for item in lock["packages"]:
        archive_path = downloads / (item["name"] + ".tar.gz")
        if not archive_path.exists():
            temporary = archive_path.with_suffix(".download")
            subprocess.run(["curl", "--fail", "--location", "--silent", "--show-error", "--max-time", "600",
                            item["url"], "--output", str(temporary)], check=True)
            if sha(temporary.read_bytes()) != item["sha256"]:
                raise ValueError(f"Toolchain archive checksum mismatch: {item['name']}")
            temporary.rename(archive_path)
        if sha(archive_path.read_bytes()) != item["sha256"]:
            raise ValueError(f"Cached toolchain archive checksum mismatch: {item['name']}")
        with tarfile.open(archive_path) as archive:
            archive.extractall(toolchains, filter="data")
        print(f"Verified and unpacked {item['version']}", flush=True)


def check_source(work):
    archive = ROOT / LOCK["archive"]["path"]
    if sha(archive.read_bytes()) != LOCK["archive"]["sha256"]:
        raise ValueError("Legacy source archive checksum mismatch")
    with tarfile.open(archive) as source:
        for member in source.getmembers():
            if not member.isfile():
                continue
            relative = Path(*Path(member.name).parts[1:])
            content = source.extractfile(member).read()
            if not (work / relative).is_file() or (work / relative).read_bytes() != content:
                raise ValueError(f"Reference source changed: {relative}")
    return archive


def build(work, toolchains):
    archive = ROOT / LOCK["archive"]["path"]
    if sha(archive.read_bytes()) != LOCK["archive"]["sha256"]:
        raise ValueError("Legacy source archive checksum mismatch")
    work.mkdir(parents=True, exist_ok=True)
    if not (work / "Makefile").exists():
        with tarfile.open(archive) as source:
            for member in source.getmembers():
                member.name = str(Path(*Path(member.name).parts[1:]))
                if member.name != ".":
                    source.extract(member, path=work, filter="data")
    check_source(work)
    tools = json.loads((ROOT / "toolchains.lock.json").read_text())
    bins = [toolchains / item["archive_roots"][0] / "bin" for item in tools["packages"]]
    env = {**os.environ, "PATH": os.pathsep.join(map(str, bins)) + os.pathsep + os.environ.get("PATH", "")}
    versions = {name: subprocess.check_output([str(bins[index] / name), "--version"], env=env, text=True).splitlines()[0]
                for index, name in enumerate(("gnatmake", "gprbuild"))}
    with (work / "build.log").open("wb") as log:
        subprocess.run(["make"], cwd=work, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
    check_source(work)
    record = {"snapshot": LOCK["id"], "platform": platform.platform(), "machine": platform.machine(),
              "versions": versions, "buildCommand": "make", "sourceChanges": [],
              "binarySha256": sha((work / "bin/words").read_bytes()),
              "generatedData": {name: sha((work / name).read_bytes()) for name in DATA_FILES}}
    (work / "build-manifest.json").write_text(json.dumps(record, indent=2) + "\n")
    return record


def run_case(work, raw, timeout=15):
    with tempfile.TemporaryDirectory(prefix="words-reference-") as temporary:
        run_dir = Path(temporary)
        for name in DATA_FILES:
            shutil.copyfile(work / name, run_dir / name)
        profile = FIXTURES / "profile/WORD.MDV"
        shutil.copyfile(profile, run_dir / "WORD.MDV")
        env = {**os.environ, "WHITAKERS_WORDS_DATADIR": str(run_dir), "LC_ALL": "C"}
        try:
            result = subprocess.run([str(work / "bin/words")], input=raw, cwd=run_dir, env=env,
                                    capture_output=True, timeout=timeout)
            return result.stdout, result.stderr, {"exitCode": result.returncode, "timedOut": False}
        except subprocess.TimeoutExpired as error:
            return error.stdout or b"", error.stderr or b"", {"exitCode": None, "timedOut": True}


def capture(work):
    if (FIXTURES / "manifest.json").exists():
        raise ValueError("A baseline already exists; verify it instead of rewriting it")
    check_source(work)
    (FIXTURES / "profile").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(work / "test/WORD.MDV_template", FIXTURES / "profile/WORD.MDV")
    seeds = [(path.name, (path / "input.txt").read_bytes(), path / "expected.txt")
             for path in sorted((work / "test").glob("[0-9][0-9]_*"))]
    probes = {
        "smoke": "rem acu tetigisti", "ambiguity": "arma amare viri", "enclitics": "multusque quidam mecum",
        "syncope": "amasti amavere amarunt", "orthography": "uirtus virtus justus iustus",
        "compounds": "amatus est\namatus esse\namatum iri", "numerals": "XIV MCMXCIX IV C.",
        "unknown": "xyzzy", "macron": "amāre", "nfd": "ama\u0304re", "mixed_script": "amo λογος",
        "empty": "", "punctuation": "... ,;!? 123", "batch_a": "est amare\namare est",
        "batch_b": "amare est\nest amare", "long_input": "a" * 2501,
    }
    seeds.extend(("probe_" + name, (value + "\n\n\n").encode(), None) for name, value in probes.items())
    cases = []
    for name, raw, expected_path in seeds:
        stdout, stderr, status = run_case(work, raw, 60 if "aeneid" in name else 15)
        directory = FIXTURES / "cases" / name
        directory.mkdir(parents=True, exist_ok=False)
        for filename, content in (("input.txt", raw), ("stdout.txt", stdout), ("stderr.txt", stderr)):
            (directory / filename).write_bytes(content)
        matches = None
        if expected_path:
            expected = expected_path.read_bytes()
            (directory / "upstream-expected.txt").write_bytes(expected)
            matches = diff_view(upstream_view(stdout)) == diff_view(expected)
        cases.append({"id": name, **status, "upstreamFixtureMatch": matches,
                      "files": {path.name: sha(path.read_bytes()) for path in sorted(directory.iterdir())}})
        print(name, status, "upstream=" + str(matches), flush=True)
    record = {"schemaVersion": 1, "snapshot": LOCK["id"], "profile": "upstream-tests-v1",
              "configuration": {"WORD.MOD": "absent; defaults from the pinned source", "WORD.MDV": sha((FIXTURES / "profile/WORD.MDV").read_bytes()),
                                "locale": "C", "process": "fresh per case; stdin bytes as captured"},
              "build": json.loads((work / "build-manifest.json").read_text()), "cases": cases}
    (FIXTURES / "manifest.json").write_text(json.dumps(record, indent=2) + "\n")
    if any(case["upstreamFixtureMatch"] is False for case in cases):
        raise ValueError("Upstream fixture divergence captured; baseline needs classification")


def verify(work):
    check_source(work)
    manifest = json.loads((FIXTURES / "manifest.json").read_text())
    if sha((FIXTURES / "profile/WORD.MDV").read_bytes()) != manifest["configuration"]["WORD.MDV"]:
        raise ValueError("Profile changed")
    failures = []
    for case in manifest["cases"]:
        directory = FIXTURES / "cases" / case["id"]
        for name, expected in case["files"].items():
            if sha((directory / name).read_bytes()) != expected:
                raise ValueError(f"Fixture changed: {case['id']}/{name}")
        stdout, stderr, status = run_case(work, (directory / "input.txt").read_bytes(), 60 if "aeneid" in case["id"] else 15)
        ok = status == {"exitCode": case["exitCode"], "timedOut": case["timedOut"]}
        ok = ok and stdout == (directory / "stdout.txt").read_bytes() and stderr == (directory / "stderr.txt").read_bytes()
        if not ok:
            failures.append(case["id"])
    if failures:
        raise ValueError("Executable baseline differs: " + ", ".join(failures))
    print(f"PASS: {len(manifest['cases'])} reference cases reproduce byte for byte")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("tools", "build", "capture", "verify"))
    parser.add_argument("--work-dir", type=Path, default=ROOT / ".cache/oracle")
    parser.add_argument("--toolchains-dir", type=Path, default=ROOT / ".tools/ada")
    parser.add_argument("--downloads-dir", type=Path, default=ROOT / ".cache/downloads")
    args = parser.parse_args()
    work = args.work_dir.resolve()
    if args.action == "tools":
        acquire_tools(args.toolchains_dir.resolve(), args.downloads_dir.resolve())
    elif args.action == "build":
        print(json.dumps(build(work, args.toolchains_dir.resolve()), indent=2))
    elif args.action == "capture":
        capture(work)
    else:
        verify(work)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
