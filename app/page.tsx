import MoodWeaver from "@/app/components/MoodWeaver";
import { getSpotifyProfile } from "@/app/lib/spotify";

export default async function Home() {
  const profile = await getSpotifyProfile();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          MoodWeave
        </h1>
        <p className="mt-4 max-w-xs text-base text-zinc-400 sm:max-w-md sm:text-lg">
          Match your mood. Make the music.
        </p>

        {profile ? (
          <p className="mt-6 text-sm text-accent-teal">
            Connected as {profile.displayName ?? "your Spotify account"}
          </p>
        ) : (
          <a
            href="/api/auth/login"
            className="mt-6 rounded-full border border-accent-teal/40 px-5 py-2 text-sm font-medium text-accent-teal transition hover:bg-accent-teal/10"
          >
            Connect Spotify
          </a>
        )}

        <MoodWeaver />
      </div>
    </main>
  );
}
