export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside mb-4">{children}</ul>;
}

export function OL({ children }: { children: React.ReactNode }) {
  return <ol>{children}</ol>;
}
