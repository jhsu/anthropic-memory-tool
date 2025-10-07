# Memory Notes - Hybrid Anthropic Memory Tool

A TypeScript implementation combining Anthropic's memory tool with Vercel's AI SDK.

## Architecture

This implementation uses:
- **@anthropic-ai/sdk**: For memory tool structure and helpers
- **@ai-sdk/anthropic + ai**: For Vercel AI SDK integration
- **Custom memory backend**: File system storage with security validation

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set your API key:
```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

3. Run the example:
```bash
bun run dev
```

## Files

- **memory-backend.ts**: File system storage implementation with security validation
- **memory-tool.ts**: Vercel AI SDK tool adapter
- **index.ts**: Example usage

## Memory Commands

All paths must start with `/memories`:

### View
```typescript
{ command: "view", path: "/memories/notes.txt" }
```

### Create
```typescript
{ command: "create", path: "/memories/notes.txt", file_text: "content" }
```

### Replace Text
```typescript
{ command: "str_replace", path: "/memories/notes.txt", old_str: "old", new_str: "new" }
```

### Insert
```typescript
{ command: "insert", path: "/memories/notes.txt", insert_line: 2, insert_text: "new line" }
```

### Delete
```typescript
{ command: "delete", path: "/memories/notes.txt" }
```

### Rename
```typescript
{ command: "rename", old_path: "/memories/old.txt", new_path: "/memories/new.txt" }
```

## Security

- All paths validated to start with `/memories`
- Path traversal blocked (`../`, `..\\`, `%2e%2e%2f`)
- File operations sandboxed to memory directory

## Usage Example

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { MemoryBackend } from './memory-backend';
import { createMemoryTool } from './memory-tool';

const memoryBackend = new MemoryBackend('./memories');
const memoryTool = createMemoryTool(memoryBackend);

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  messages: [{ role: 'user', content: 'Remember this...' }],
  tools: { memory: memoryTool },
  maxSteps: 10,
});
```
