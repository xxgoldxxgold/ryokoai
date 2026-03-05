import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from './systemPrompt';
import { AI_TOOLS } from './tools';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: 'user' | 'assistant';
  content: string | Anthropic.ContentBlock[];
}

export async function chatWithClaude(
  messages: Message[],
  onToolUse: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>
) {
  const formattedMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let finalText = '';
  let metadata: Record<string, unknown> = {};
  let toolCallCount = 0;
  const maxToolCalls = 3;

  while (toolCallCount < maxToolCalls) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: getSystemPrompt(),
      tools: AI_TOOLS as Anthropic.Tool[],
      messages: formattedMessages,
    });

    const textBlocks: string[] = [];
    let hasToolUse = false;

    for (const block of response.content) {
      if (block.type === 'text') {
        textBlocks.push(block.text);
      } else if (block.type === 'tool_use') {
        hasToolUse = true;
        toolCallCount++;

        const toolResult = await onToolUse(block.name, block.input as Record<string, unknown>);

        if (block.name === 'search_hotels') {
          metadata.hotels = toolResult;
        } else if (block.name === 'search_flights') {
          metadata.flights = toolResult;
        } else if (block.name === 'create_itinerary') {
          metadata.itinerary = toolResult;
        }

        formattedMessages.push({
          role: 'assistant',
          content: response.content,
        });
        formattedMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(toolResult),
            },
          ],
        });
      }
    }

    if (textBlocks.length > 0) {
      finalText += textBlocks.join('');
    }

    if (!hasToolUse) {
      break;
    }
  }

  return { text: finalText, metadata };
}
