import { ClaudeResponse } from '../types';
import { CLAUDE_API_CONFIG } from '../constants';

export class ClaudeAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeAPIError';
  }
}

export const sendMessage = async (
  apiKey: string,
  userMessage: string,
  systemPrompt: string
): Promise<string> => {
  try {
    const response = await fetch(CLAUDE_API_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_API_CONFIG.version,
      },
      body: JSON.stringify({
        model: CLAUDE_API_CONFIG.model,
        max_tokens: CLAUDE_API_CONFIG.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new ClaudeAPIError(`API request failed with status ${response.status}`);
    }

    const data: ClaudeResponse = await response.json();

    if (data.content && data.content[0]) {
      return data.content[0].text;
    } else {
      throw new ClaudeAPIError('Invalid response format from Claude API');
    }
  } catch (error) {
    if (error instanceof ClaudeAPIError) {
      throw error;
    }
    throw new ClaudeAPIError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};
