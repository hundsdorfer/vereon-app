export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold text-foreground">Vereon</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Vereinsmanagement für Fußballvereine
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
