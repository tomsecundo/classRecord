# Project workflow

The user requests automatic GitHub synchronization after every completed revision to this project.

- After making a coherent revision, run the relevant checks, review the diff, commit the intended changes, and push to the configured GitHub repository and branch without requesting permission again.
- Do not claim synchronization succeeded unless the push succeeded. Report authentication, network, or merge blockers clearly.
- Never force-push, overwrite remote history, or include unrelated user changes. Reconcile remote changes safely before pushing.
- Do not commit credentials, local databases, student records, reference workbooks, generated exports, dependencies, or build outputs.
- Sync destination: `https://github.com/tomsecundo/classRecord.git`, remote `origin`, branch `main`.
- This instruction authorizes pushing completed revisions to that repository; it does not configure a background file watcher or sync student records.

Application source lives in `pshs-class-record/`.
