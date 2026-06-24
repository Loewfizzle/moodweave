// Pure mood → Spotify search-query mapping. No API calls; fully testable.
// Sliders are 1–5: low (1–2), mid (3, ignored), high (4–5).

export type MoodValues = {
  energy: number;
  mood: number;
  focus: number;
  edge: number;
};

const WORD_BANKS = {
  energy: {
    low: ["calm", "chill", "mellow", "ambient", "downtempo", "soft"],
    high: ["energetic", "upbeat", "driving", "fast", "hype", "pumping"],
  },
  mood: {
    low: ["dark", "moody", "melancholy", "brooding", "somber", "haunting"],
    high: ["bright", "happy", "sunny", "uplifting", "feel-good", "warm"],
  },
  focus: {
    low: ["instrumental", "lo-fi", "atmospheric", "study", "background", "minimal"],
    high: ["anthem", "epic", "cinematic", "powerful", "bold", "dramatic"],
  },
  edge: {
    low: ["classic", "popular", "smooth", "easy", "familiar", "timeless"],
    high: ["experimental", "weird", "eclectic", "psychedelic", "avant-garde", "glitchy"],
  },
} as const;

// Used when every slider is centered (all 3) so we still return music.
const FALLBACK_WORDS = ["popular", "chill", "indie"];
const NUM_QUERIES = 5;

type Dimension = keyof typeof WORD_BANKS;
const DIMENSIONS: Dimension[] = ["energy", "mood", "focus", "edge"];

// Each slider contributes its low or high word bank, or nothing when centered.
function activeBanks(mood: MoodValues): string[][] {
  const banks: string[][] = [];
  for (const dim of DIMENSIONS) {
    const value = mood[dim];
    if (value <= 2) banks.push([...WORD_BANKS[dim].low]);
    else if (value >= 4) banks.push([...WORD_BANKS[dim].high]);
    // value === 3 → don't-care, contributes nothing
  }
  return banks;
}

// Turn a mood into ~5 Spotify search queries.
export function moodToQueries(mood: MoodValues): string[] {
  const banks = activeBanks(mood);

  // Everything centered → gentle generic fallback.
  if (banks.length === 0) {
    return [...FALLBACK_WORDS];
  }

  // A single active dimension → a few single-word queries from its bank.
  if (banks.length === 1) {
    return banks[0].slice(0, NUM_QUERIES);
  }

  // Two or more → mix one word from two different banks per query, rotating
  // through banks and their words so the queries vary.
  const queries: string[] = [];
  for (let i = 0; i < NUM_QUERIES; i++) {
    const bankA = banks[i % banks.length];
    const bankB = banks[(i + 1) % banks.length];
    const wordA = bankA[i % bankA.length];
    const wordB = bankB[(i + 1) % bankB.length];
    queries.push(`${wordA} ${wordB}`);
  }

  // Dedupe in case the rotation produced a repeat.
  return [...new Set(queries)];
}
