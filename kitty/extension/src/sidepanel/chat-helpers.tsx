// Side panel chat helpers: what's on the active tab, the "thinking" timer, and sending the cat to a page.
import { Waiting } from '../shared/Waiting';
import { actionUrl, PENDING_ACTION_KEY, type PageAction, type PendingAction } from '../shared/actions';
import type { PageContext, PageContextRequest } from '../shared/page-context';
import { COPILOT_PENDING_KEY, COPILOT_URL, type CopilotPending } from '../shared/copilot';

/** Open GitHub Copilot in a new tab; Kitty's content script there types `prompt` into its chat box. */
export async function openCopilot(prompt: string): Promise<void> {
  const pending: CopilotPending = { prompt, at: Date.now() };
  await chrome.storage.session.set({ [COPILOT_PENDING_KEY]: pending });
  await chrome.tabs.create({ url: COPILOT_URL });
}

/** Ask the content script in the active tab what's on screen (null when it isn't a GitHub page). */
export async function activePageContext(): Promise<PageContext | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id === undefined) return null;
    const msg: PageContextRequest = { type: 'get-page-context' };
    const ctx = (await chrome.tabs.sendMessage(tab.id, msg)) as PageContext | undefined;
    return ctx?.url ? ctx : null;
  } catch {
    return null; // no Kitty content script there (not github.com, or the tab is still loading)
  }
}

export const Thinking = () => <Waiting label="Kitty is thinking" />;

/** Send the active tab to the action's page; the cat there picks the action up and runs it. */
export async function runOnPage(action: PageAction): Promise<void> {
  const url = actionUrl(action);
  const pending: PendingAction = { action, url, at: Date.now() };
  await chrome.storage.session.set({ [PENDING_ACTION_KEY]: pending });
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id !== undefined) await chrome.tabs.update(tab.id, { url });
  else await chrome.tabs.create({ url });
}
