---
trigger: always_on
---

# Python Virtual Environment & Dependency Enforcement

- **Explicit Virtual Environment**: All scripts, tests, background services, and CLI tools must execute strictly via `.venv\\Scripts\\python.exe` (Windows) or `.venv/bin/python` (Unix). Never invoke global `python` or `python3`.
- **Prohibited Global Pip**: Global `pip install` is strictly prohibited. All packages must be installed directly through `.venv\\Scripts\\pip.exe`.
- **State Preservation**: Whenever dependencies are installed, updated, or removed, `.venv\\Scripts\\pip.exe freeze` must update `requirements.txt` to guarantee reproducible builds.
- **Reactive Probing**: Environment and package availability probing is performed only when resolving missing packages (`ModuleNotFoundError`) or upon explicit user request — never proactively before writing code.
