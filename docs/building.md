# Build and Verify the Legacy Reference

The qualified reference uses GNAT 15.3.0 and GPRBuild 25.0.0 on Apple Silicon
macOS. Exact package URLs and SHA-256 values are in
[toolchains.lock.json](../toolchains.lock.json). These are project-local compiler
tools, not dependencies of the planned JavaScript runtime.

Requirements: Python 3.14 for the standard-library driver, `curl`, `tar`-compatible
archives, `make`, and the macOS command-line developer tools. No package-manager
installation or global shell configuration is performed by these commands.

From the repository root:

```sh
python3 scripts/legacy.py tools
python3 scripts/legacy.py build
python3 scripts/legacy.py verify
```

The first command verifies and extracts the two compiler distributions under
`.tools/ada/`, retaining downloaded archives in `.cache/downloads/`. The build
unpacks the locked source archive into `.cache/oracle/` and invokes its unmodified
Makefile. The driver checks every original source file against the archive before
and after building. Generated files stay in the ignored work directory.

An existing project-local compiler directory can be supplied using
`--toolchains-dir`; `--work-dir` selects an isolated reference build directory.
The configured directory must contain the exact archive root names from the lock.

`verify` runs the reference executable afresh for each fixture in a temporary data
directory. It compares raw stdout, stderr and exit/timeout state byte for byte
against the committed baseline. It never updates the expected files. The
`capture` action was used once to establish this snapshot and refuses to overwrite
an existing baseline; a deliberate new snapshot requires a separate version.

## Upstream test-driver adaptation

The pinned `make test` driver uses Bash features unavailable in macOS Bash 3.2;
the direct invocation fails in the script before engine tests run. The portable
driver executes all five original input files with the same developer profile
and compares their expected files using the original rules: remove the first
18 and final output lines, then ignore trailing whitespace/CR. All five original
fixtures pass under this equivalent driver.

This changes the test runner only. No Ada source, algorithm, dictionary or rule
file was edited. The frozen expanded baseline is stricter: replay compares raw
bytes, including startup and terminal messages, rather than the normalized view.

## Reproducibility boundary

The source archive, input data, toolchain distributions and profiles are locked.
The manifest records observed executable and generated-data hashes. An executable
hash is build evidence, not a cross-platform reproducibility promise: debug paths,
linker/SDK and binary signing can affect native executable bytes. Behavioral
reproduction is assessed separately by the fixture replay.

Two independent build directories on the qualified host produced different native
executable hashes and different `DICTFILE.GEN`, `STEMFILE.GEN` and `INFLECTS.SEC`
hashes. Both reproduced all 21 captured cases byte for byte. The cause of the
native-file differences has not been adjudicated; no exhaustive semantic or binary
equivalence is inferred. Do not promote those native files to portable source data.

Other operating systems and compilers are not yet qualified. A different native
build must retain its own build identity and pass the reference corpus before it
is treated as the same behavioral profile.
