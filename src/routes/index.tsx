import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tasklet — A calm, private todo app" },
      {
        name: "description",
        content:
          "Capture tasks in seconds, set priorities and due dates, and keep every list private to your account.",
      },
      { property: "og:title", content: "Tasklet — A calm, private todo app" },
      {
        property: "og:description",
        content:
          "Capture tasks in seconds, set priorities and due dates, and keep every list private to your account.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Zap, title: "Capture fast", body: "One field, one keystroke. Details are optional." },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Row-level security means only you can read your list.",
  },
  {
    icon: CheckCircle2,
    title: "Stay on top",
    body: "Priorities, due dates and overdue highlighting.",
  },
];

function Index() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <span className="font-display text-2xl">Tasklet</span>
        <Button asChild variant="ghost" size="sm">
          <Link to={signedIn ? "/todos" : "/auth"}>{signedIn ? "My list" : "Sign in"}</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pt-20">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Todo, minus the noise</p>
        <h1 className="mt-4 max-w-2xl text-5xl leading-[1.05] sm:text-7xl">
          A quiet place for
          <span className="italic text-primary"> everything you owe yourself.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Tasklet keeps your tasks in one focused list with priorities, due dates and instant
          filtering — nothing else.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={signedIn ? "/todos" : "/auth"}>
              {signedIn ? "Open my list" : "Get started free"}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">I already have an account</Link>
          </Button>
        </div>

        <ul className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-3 text-xl">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
