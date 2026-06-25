import MoodWeaver from "@/app/components/MoodWeaver";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="text-foreground">Mood</span>
          <span className="bg-gradient-to-r from-accent-violet to-accent-teal bg-clip-text text-transparent">
            Weave
          </span>
        </h1>
        <p className="mt-4 max-w-xs text-base text-zinc-400 sm:max-w-md sm:text-lg">
          Match your mood. Make the music.
        </p>

        <MoodWeaver />
      </div>
    </main>
  );
}
