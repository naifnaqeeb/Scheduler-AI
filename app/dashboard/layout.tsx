export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Route protection is handled by middleware.ts via JWT cookie verification.
  // No Clerk wrapping needed.
  return <>{children}</>
}
