import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, FilePlus2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-12 sm:px-8 lg:py-16">
      <section className="max-w-3xl">
        <p className="mb-4 font-mono text-xs font-semibold tracking-wide text-primary uppercase">
          Source-led UML modelling
        </p>
        <h1 className="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
          Describe the behaviour. See the system.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          A focused, local-first workbench for writing readable use case syntax
          and rendering standards-aware UML diagrams as you type.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/editor">
              <FilePlus2 data-icon="inline-start" />
              Create a diagram
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/examples">
              View examples
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-16 border-t pt-6" aria-labelledby="recent-heading">
        <div>
          <h2 id="recent-heading" className="text-lg font-semibold">
            Recent diagrams
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your locally saved diagrams will appear here.
          </p>
        </div>
        <div className="mt-6 flex min-h-44 items-center justify-center rounded-xl border border-dashed bg-muted/35 px-6 text-center">
          <div className="max-w-sm">
            <p className="font-medium">No saved diagrams yet</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Create your first diagram to start a local project library.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
