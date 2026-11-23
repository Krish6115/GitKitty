import { stripAction } from './actions';
import { sourceLabel, type ChatMessage } from './chat';

function escapeMarkdownLinkLabel(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/** Convert the current Kitty conversation into a Markdown transcript. */
export function buildChatMarkdown(
  messages: readonly ChatMessage[],
): string {
  const sections = ['# Kitty Chat'];

  for (const message of messages) {
    if (message.role === 'user') {
      sections.push(`**You:**\n\n${message.content}`);
      continue;
    }

    // Match the UI by removing internal ACTION metadata.
    const answer = stripAction(message.content);
    const parts = [
      `**Kitty:**\n\n${answer || '_No answer text was received._'}`,
    ];

    // Preserve partial content and make its completion state clear.
    if (message.status === 'stopped') {
      parts.push('_Stopped before the answer finished._');
    } else if (message.status === 'streaming') {
      parts.push('_Answer was still generating when exported._');
    }

    if (message.status === 'error' && message.error) {
      parts.push(`_Kitty error: ${message.error}_`);
    }

    if (message.sources.length > 0) {
      const sourceLinks = message.sources.map(
        (source) =>
          `- [${escapeMarkdownLinkLabel(sourceLabel(source))}](<${source.sourceUrl}>)`,
      );

      parts.push(`**Sources:**\n${sourceLinks.join('\n')}`);
    }

    sections.push(parts.join('\n\n'));
  }

  return `${sections.join('\n\n').trim()}\n`;
}
