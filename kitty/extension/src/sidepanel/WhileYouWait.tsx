// While the model is still queued, show Kitty's saved answer to the closest common question. It appears after a few
// seconds (so quick answers don't flash it) and goes away once the real answer starts.
import type { ChatMessage } from '../shared/chat';
import { Markdown } from '../shared/Markdown';
import { useSeconds } from '../shared/Waiting';

type Related = NonNullable<Extract<ChatMessage, { role: 'assistant' }>['related']>;

export function WhileYouWait({ related }: { related: Related }) {
  if (useSeconds() < 5) return null;
  return (
    <details class="related" data-kitty="related" open>
      <summary>While you wait: Kitty's saved answer to "{related.question}"</summary>
      <Markdown text={related.answer} sources={related.sources} />
    </details>
  );
}
