import * as fs from 'fs';
import * as path from 'path';

export interface MemoryCommand {
  command: 'view' | 'create' | 'str_replace' | 'insert' | 'delete' | 'rename';
  path?: string;
  view_range?: [number, number];
  file_text?: string;
  old_str?: string;
  new_str?: string;
  insert_line?: number;
  insert_text?: string;
  old_path?: string;
  new_path?: string;
}

export class MemoryBackend {
  private baseDir: string;

  constructor(baseDir: string = './memories') {
    this.baseDir = path.resolve(baseDir);
    // Ensure base directory exists
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private validatePath(filePath: string): string {
    // Security: Ensure path starts with /memories
    if (!filePath.startsWith('/memories')) {
      throw new Error('Path must start with /memories');
    }

    // Security: Block path traversal
    const normalized = path.normalize(filePath);
    if (normalized.includes('..') || normalized.includes('%2e%2e')) {
      throw new Error('Path traversal not allowed');
    }

    // Convert /memories path to actual filesystem path
    const relativePath = filePath.replace('/memories', '');
    return path.join(this.baseDir, relativePath);
  }

  private listDirectory(dirPath: string): string {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files
      .map(file => {
        const prefix = file.isDirectory() ? '[DIR]' : '[FILE]';
        return `${prefix} ${file.name}`;
      })
      .join('\n');
  }

  private readFileWithLineNumbers(filePath: string, viewRange?: [number, number]): string {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const [start, end] = viewRange || [1, lines.length];
    const selectedLines = lines.slice(start - 1, end);

    return selectedLines
      .map((line, idx) => `${start + idx}→${line}`)
      .join('\n');
  }

  async execute(command: MemoryCommand): Promise<string> {
    try {
      switch (command.command) {
        case 'view': {
          const fullPath = this.validatePath(command.path!);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            return this.listDirectory(fullPath);
          } else {
            return this.readFileWithLineNumbers(fullPath, command.view_range);
          }
        }

        case 'create': {
          const fullPath = this.validatePath(command.path!);
          const dir = path.dirname(fullPath);

          // Ensure directory exists
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(fullPath, command.file_text || '', 'utf-8');
          return `File created: ${command.path}`;
        }

        case 'str_replace': {
          const fullPath = this.validatePath(command.path!);
          let content = fs.readFileSync(fullPath, 'utf-8');

          if (!content.includes(command.old_str!)) {
            throw new Error('String not found in file');
          }

          content = content.replace(command.old_str!, command.new_str!);
          fs.writeFileSync(fullPath, content, 'utf-8');
          return `Text replaced in ${command.path}`;
        }

        case 'insert': {
          const fullPath = this.validatePath(command.path!);
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          lines.splice(command.insert_line! - 1, 0, command.insert_text!.trimEnd());
          fs.writeFileSync(fullPath, lines.join('\n'), 'utf-8');
          return `Text inserted at line ${command.insert_line} in ${command.path}`;
        }

        case 'delete': {
          const fullPath = this.validatePath(command.path!);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true });
          } else {
            fs.unlinkSync(fullPath);
          }
          return `Deleted: ${command.path}`;
        }

        case 'rename': {
          const oldPath = this.validatePath(command.old_path!);
          const newPath = this.validatePath(command.new_path!);

          fs.renameSync(oldPath, newPath);
          return `Renamed ${command.old_path} to ${command.new_path}`;
        }

        default:
          throw new Error(`Unknown command: ${(command as any).command}`);
      }
    } catch (error) {
      throw new Error(`Memory operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
