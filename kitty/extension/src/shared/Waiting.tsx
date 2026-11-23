// "Kitty is thinking (1:05)", and after 15 s an honest note on why: BharatCode's free tier can keep a request in its
// queue for a few minutes before the model starts answering. Everyone on Kitty's server shares one BharatCode key, and
// one key's requests run one at a time, so people without their own key are told how to skip that line.
import { useEffect, useState } from 'preact/hooks';
import { getSettings } from './settings';

export const formatWait = (s: number): string => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

/** Seconds since the component appeared, ticking once a second. */
export function useSeconds(): number {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

export function Waiting({ label }: { label: string }) {
  const s = useSeconds();
  const [ownKey, setOwnKey] = useState(true);
  useEffect(() => void getSettings().then((st) => setOwnKey(Boolean(st.kittyKey?.trim()))).catch(() => {}), []);
  return (
    <>
      <p class="thinking">{label}{s >= 3 ? ` (${formatWait(s)})` : ''}</p>
      {s >= 15 && (
        <p class="slow" data-kitty="slow">
          BharatCode's free model is busy, so Kitty is waiting in its queue. This can take a few minutes.
          {!ownKey && " Kitty's users share one key and wait behind each other; adding your own BharatCode key in Kitty's Settings avoids that."}
        </p>
      )}
    </>
  );
}
