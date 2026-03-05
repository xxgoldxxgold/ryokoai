import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';
import { AI_TOOLS } from '@/lib/ai/tools';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function callHotelSearch(input: Record<string, unknown>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/hotels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

async function callFlightSearch(input: Record<string, unknown>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/flights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const { messages, session_id } = await req.json();

  const formattedMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let toolCallCount = 0;
        const maxToolCalls = 3;
        let metadata: Record<string, unknown> = {};

        while (toolCallCount <= maxToolCalls) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            tools: AI_TOOLS as Anthropic.Tool[],
            messages: formattedMessages,
          });

          let hasToolUse = false;

          for (const block of response.content) {
            if (block.type === 'text') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`)
              );
            } else if (block.type === 'tool_use') {
              hasToolUse = true;
              toolCallCount++;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_start', tool: block.name })}\n\n`
                )
              );

              let toolResult: unknown;

              if (block.name === 'search_hotels') {
                toolResult = await callHotelSearch(block.input as Record<string, unknown>);
                metadata.hotels = toolResult;
              } else if (block.name === 'search_flights') {
                toolResult = await callFlightSearch(block.input as Record<string, unknown>);
                metadata.flights = toolResult;
              } else if (block.name === 'create_itinerary') {
                toolResult = { status: 'ok', input: block.input };
                metadata.itinerary = block.input;
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

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_result', tool: block.name, data: toolResult })}\n\n`
                )
              );
            }
          }

          if (!hasToolUse) break;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'metadata', data: metadata, session_id })}\n\n`
          )
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
