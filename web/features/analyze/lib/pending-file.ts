/**
 * Hands a chosen file from the landing page to the analysis workspace.
 *
 * A `File` cannot travel through a URL or `sessionStorage`, and copying it
 * into IndexedDB just to read it back one navigation later would be a lot of
 * machinery for a value that only needs to survive a client-side route change.
 * Both pages live in the same bundle, so a module-scoped slot is enough.
 *
 * `take` clears as it reads: the file must not be re-analyzed if the user
 * navigates back to the workspace later, which would silently re-run an
 * analysis they did not ask for.
 */

let pending: File | null = null;

export function setPendingFile(file: File): void {
  pending = file;
}

export function takePendingFile(): File | null {
  const file = pending;
  pending = null;
  return file;
}
