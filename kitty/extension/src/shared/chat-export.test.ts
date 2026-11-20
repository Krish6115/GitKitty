import { describe, expect, it } from 'vitest';
import type { ChatMessage } from './chat';
import { buildChatMarkdown } from './chat-export';

const source = {
  n: 1,
  title: 'Pro Git',
  headingPath: ['Git Branching', 'Rebasing'],
  sourceFile: 'git/rebase.md',
  sourceUrl: 'https://git-scm.com/book/en/v2/Git-Branching-Rebasing',
  license: 'CC BY-NC-SA 3.0',
};

describe('buildChatMarkdown', () => {
  it('exports questions, answers, and source links', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'How does rebase work?' },
      {
        role: 'assistant',
        content: 'Rebase reapplies commits onto a new base.',
        sources: [source],
        status: 'done',
      },
    ];

    const markdown = buildChatMarkdown(messages);

    expect(markdown).toContain('**You:**');
    expect(markdown).toContain('How does rebase work?');
    expect(markdown).toContain('**Kitty:**');
    expect(markdown).toContain(
      'Rebase reapplies commits onto a new base.',
    );
    expect(markdown).toContain('**Sources:**');
    expect(markdown).toContain(
      'https://git-scm.com/book/en/v2/Git-Branching-Rebasing',
    );
  });

  it('exports an answer without sources and omits the Sources heading', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What is git init?' },
      {
        role: 'assistant',
        content: 'Git init creates a repository.',
        sources: [],
        status: 'done',
      },
    ];

    const markdown = buildChatMarkdown(messages);

    expect(markdown).toContain('Git init creates a repository.');
    expect(markdown).not.toContain('**Sources:**');
  });

  it('preserves the content of a stopped answer and marks it as stopped', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Explain merge conflicts.' },
      {
        role: 'assistant',
        content: 'A merge conflict happens when Git cannot...',
        sources: [],
        status: 'stopped',
      },
    ];

    const markdown = buildChatMarkdown(messages);

    expect(markdown).toContain(
      'A merge conflict happens when Git cannot...',
    );
    expect(markdown).toContain(
      '_Stopped before the answer finished._',
    );
  });

  it('strips internal ACTION metadata from answers', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Take me to issue 42' },
      {
        role: 'assistant',
        content: 'Sure!\nACTION: {"type":"explain_issue","repo":"cli/cli","number":42}',
        sources: [],
        status: 'done',
      },
    ];

    const markdown = buildChatMarkdown(messages);

    expect(markdown).toContain('Sure!');
    expect(markdown).not.toContain('ACTION:');
  });

  it('handles streaming answers and marks them as still generating', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'How do I rebase?' },
      {
        role: 'assistant',
        content: 'Git rebase is',
        sources: [],
        status: 'streaming',
      },
    ];

    const markdown = buildChatMarkdown(messages);

    expect(markdown).toContain('Git rebase is');
    expect(markdown).toContain('_Answer was still generating when exported._');
  });

  it('handles error status with error message', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'How do I rebase?' },
      {
        role: 'assistant',
        content: '',
        sources: [],
        status: 'error',
        error: 'Network disconnected.',
      },
    ];

    const markdown = buildChatMarkdown(messages);

    expect(markdown).toContain('_No answer text was received._');
    expect(markdown).toContain('_Kitty error: Network disconnected._');
  });
});
