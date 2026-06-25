import MoodWeaver from "@/app/components/MoodWeaver";

// Friendly messages for the error codes the OAuth callback can redirect with.
const OAUTH_ERRORS: Record<string, string> = {
  denied: "Spotify access was declined. You can try connecting again.",
  state_mismatch: "Couldn't verify your login. Please try connecting again.",
  token_error: "Spotify login failed. Please try again.",
  config_error: "Server configuration error. Please try again later.",
  error: "Something went wrong during login. Please try again.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ spotify?: string }>;
}) {
  const { spotify } = await searchParams;
  const oauthError = spotify ? (OAUTH_ERRORS[spotify] ?? OAUTH_ERRORS.error) : null;

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

        {oauthError && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {oauthError}
          </p>
        )}

        <MoodWeaver />
      </div>
    </main>
  );
}
