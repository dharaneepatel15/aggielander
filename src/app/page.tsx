export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#500000] px-6 text-center text-white">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">AggieLander</h1>
      <p className="max-w-xl text-lg text-white/80">
        An app that makes student life at Texas A&amp;M easier. Edit{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">src/app/page.tsx</code>{" "}
        to start building.
      </p>
    </main>
  );
}
