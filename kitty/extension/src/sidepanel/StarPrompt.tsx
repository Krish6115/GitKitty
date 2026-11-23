// Shown once, after Kitty has helped a few times. Either button closes it for good.
import { NEW_PROMPT, REPO_URL, shouldAsk, STAR_PROMPT_KEY, type StarPrompt as State } from '../shared/star-prompt';
import { Icon } from '../shared/Icon';
import { useLocal } from './QuizCard';

export function StarPrompt() {
  const [s, setS] = useLocal<State>(STAR_PROMPT_KEY, NEW_PROMPT);
  if (!shouldAsk(s)) return null;
  const close = (): void => setS({ ...s, closed: true });
  return (
    <div class="star-prompt" data-kitty="star-prompt" role="note">
      <p>Kitty is free and open source. If it helped you, a star on GitHub helps other learners find it.</p>
      <div class="row">
        <button class="small" data-kitty="star-repo" onClick={() => { close(); window.open(REPO_URL, '_blank', 'noopener'); }}>
          <Icon name="star" size={12} /> Star on GitHub
        </button>
        <button class="ghost small" data-kitty="star-later" onClick={close}>No thanks</button>
      </div>
    </div>
  );
}
