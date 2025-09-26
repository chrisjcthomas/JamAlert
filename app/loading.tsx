import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Loading JamAlert...</p>
      </div>
    </div>
  )
}
