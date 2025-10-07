import { tool } from 'ai';
import { z } from 'zod';
import { MemoryBackend } from './memory-backend';

const memoryCommandSchema = z.discriminatedUnion('command', [
  z.object({
    command: z.literal('view'),
    path: z.string(),
    view_range: z.tuple([z.number(), z.number()]).optional(),
  }),
  z.object({
    command: z.literal('create'),
    path: z.string(),
    file_text: z.string(),
  }),
  z.object({
    command: z.literal('str_replace'),
    path: z.string(),
    old_str: z.string(),
    new_str: z.string(),
  }),
  z.object({
    command: z.literal('insert'),
    path: z.string(),
    insert_line: z.number(),
    insert_text: z.string(),
  }),
  z.object({
    command: z.literal('delete'),
    path: z.string(),
  }),
  z.object({
    command: z.literal('rename'),
    old_path: z.string(),
    new_path: z.string(),
  }),
]);

export function createMemoryTool(backend: MemoryBackend) {
  return tool({
    description: `Memory management tool for persistent storage.

Command Examples:

1. view - List directory or view file contents
   Required: command, path
   Optional: view_range (array of 2 numbers: [start_line, end_line])
   Example: {command: "view", path: "/memories/notes.txt", view_range: [1, 10]}

2. create - Create or update a file
   Required: command, path, file_text
   Example: {command: "create", path: "/memories/notes.txt", file_text: "Hello World"}

3. str_replace - Replace text in a file
   Required: command, path, old_str, new_str
   Example: {command: "str_replace", path: "/memories/notes.txt", old_str: "old text", new_str: "new text"}

4. insert - Insert text at a specific line
   Required: command, path, insert_line (number), insert_text
   Example: {command: "insert", path: "/memories/notes.txt", insert_line: 5, insert_text: "New line"}

5. delete - Delete a file or directory
   Required: command, path
   Example: {command: "delete", path: "/memories/notes.txt"}

6. rename - Rename or move a file
   Required: command, old_path, new_path
   Example: {command: "rename", old_path: "/memories/old.txt", new_path: "/memories/new.txt"}

All paths must start with /memories`,
    inputSchema: z.object({
      command: z.enum(['view', 'create', 'str_replace', 'insert', 'delete', 'rename'])
        .describe('The memory operation to perform'),
      path: z.string().optional()
        .describe('File path (must start with /memories). Required for: view, create, str_replace, insert, delete. Not used for: rename'),
      view_range: z.array(z.number()).optional()
        .describe('Array with [start_line, end_line] for view command. Example: [1, 10] to view lines 1-10. Only used with view command'),
      file_text: z.string().optional()
        .describe('Complete file content. Only required for create command'),
      old_str: z.string().optional()
        .describe('Exact text string to find and replace. Only required for str_replace command'),
      new_str: z.string().optional()
        .describe('New text to replace old_str with. Only required for str_replace command'),
      insert_line: z.number().optional()
        .describe('Line number (1-indexed) where text should be inserted. Only required for insert command'),
      insert_text: z.string().optional()
        .describe('Text content to insert at the specified line. Only required for insert command'),
      old_path: z.string().optional()
        .describe('Source file path to rename from (must start with /memories). Only required for rename command'),
      new_path: z.string().optional()
        .describe('Destination file path to rename to (must start with /memories). Only required for rename command'),
    }),
    execute: async (params) => {
      const result = await backend.execute(params as any);
      return {
        result
      }
    },
  });
}
