import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to SlideFlow</h1>
        <p className="text-xl text-gray-600 mb-8">
          Practice your presentations with real-time timing feedback
        </p>
        <Link href="/practice">
          <Button size="lg">
            Start Practicing
          </Button>
        </Link>
      </div>
    </div>
  )
} 