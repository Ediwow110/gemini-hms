/**
 * Helper to download a file from a Blob response.
 * Handles Content-Disposition filename extraction and falls back to a provided default.
 */
export async function downloadBlob(blob: Blob, defaultFilename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
