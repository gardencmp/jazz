export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex min-h-screen flex-col p-24">
            {children}
        </main>
    );
}
