import MoodWeaver from "@/app/components/MoodWeaver";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          MoodWeave
        </h1>
        <p className="mt-4 max-w-xs text-base text-zinc-400 sm:max-w-md sm:text-lg">
          Match your mood. Make the music.
        </p>

        <MoodWeaver />
      </div>
    </main>
  );
}
