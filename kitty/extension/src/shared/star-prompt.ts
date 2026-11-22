// A one-time "star the repo" note in the side panel, shown after Kitty has helped a few times
// (answers, finished lessons, finished tours). Once it's clicked or dismissed it never comes back.

export const STAR_PROMPT_KEY = 'kitty:star-prompt';
export const REPO_URL = 'https://github.com/Krish6115/GitKitty';
/** How many times Kitty has to help before asking. */
export const ASK_AFTER = 3;

export interface StarPrompt {
  helped: number;
  /** Clicked or dismissed: never ask again. */
  closed: boolean;
}

export const NEW_PROMPT: StarPrompt = { helped: 0, closed: false };

export const shouldAsk = (s: StarPrompt): boolean => !s.closed && s.helped >= ASK_AFTER;

/** Count one more time Kitty helped (stops counting once it's enough to ask). */
export const addHelp = (s: StarPrompt): StarPrompt => (s.closed || s.helped >= ASK_AFTER ? s : { ...s, helped: s.helped + 1 });

async function load(): Promise<StarPrompt> {
  return ((await chrome.storage.local.get(STAR_PROMPT_KEY))[STAR_PROMPT_KEY] as StarPrompt | undefined) ?? NEW_PROMPT;
}

export async function recordHelp(): Promise<void> {
  const s = await load();
  const next = addHelp(s);
  if (next !== s) await chrome.storage.local.set({ [STAR_PROMPT_KEY]: next });
}
