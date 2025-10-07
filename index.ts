import { anthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs } from 'ai';
import { MemoryBackend } from './memory-backend';
import { createMemoryTool } from './memory-tool';

// Initialize memory backend
const memoryBackend = new MemoryBackend('./memories');
const memoryTool = createMemoryTool(memoryBackend);

async function main() {
  const result = await generateText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    headers: {
      'anthropic-beta': 'context-management-2025-06-27'
    },
    messages: [
      {
        role: 'user',
        content: 'Add a memory about my love for TypeScript.',
      },
    ],
    tools: {
      memory: memoryTool,
    },
    stopWhen: stepCountIs(10),
  });

  console.log('Response:', result.text);
  console.log(JSON.stringify(result.steps.map(step => step.content), null, 2));
}

main().catch(console.error);
