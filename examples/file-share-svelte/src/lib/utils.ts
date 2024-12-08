/**
 * Formats a file size in bytes to a human readable string
 * @param bytes The size in bytes
 * @returns A formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generates a temporary file ID based on the file name and creation time
 * @param fileName The name of the file
 * @param createdAt The creation date
 * @returns A unique file ID string
 */
export function generateTempFileId(fileName: string, createdAt: Date): string {
  return `file-${fileName}-${createdAt.getTime()}`;
}
