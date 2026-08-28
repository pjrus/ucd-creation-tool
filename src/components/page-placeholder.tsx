import type { LucideIcon } from 'lucide-react'

export type PagePlaceholderProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-12 sm:px-8">
      <section className="w-full rounded-xl border bg-card p-6 sm:p-10">
        <Icon className="size-6 text-primary" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
          {title}
        </h1>
        <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  )
}
