// "Kitty is thinking (1:05)", and after 15 s an honest note on why: BharatCode's free tier can keep a request in its
// queue for a few minutes before the model starts answering.
import { useEffect, useState } from 'preact/hooks';

export const formatWait = (s: number): string => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

export function Waiting({ label }: { label: string }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <p class="thinking">{label}{s >= 3 ? ` (${formatWait(s)})` : ''}</p>
      {s >= 15 && <p class="slow" data-kitty="slow">BharatCode's free model is busy, so Kitty is waiting in its queue. This can take a few minutes.</p>}
    </>
  );
}
