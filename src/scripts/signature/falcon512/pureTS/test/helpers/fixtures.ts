import { readFileSync } from 'node:fs';
import path from 'node:path';

export const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

/** Parses a JSON file of test/fixtures, keeping every number as a bigint (felts exceed 2^53). */
export function readJsonBig(relativePath: string): any {
  const text = readFileSync(path.join(FIXTURES_DIR, relativePath), 'utf8');
  return (JSON.parse as any)(text, (_key: string, value: unknown, context: { source?: string }) =>
    typeof value === 'number' ? BigInt(context.source as string) : value
  );
}

/** Sequential reader of a Cairo Serde array made of `[length, v0, v1, …]` blocks. */
export class SerdeReader {
  private pos = 0;

  constructor(private readonly data: bigint[]) {}

  array(): bigint[] {
    const length = Number(this.data[this.pos++]);
    const out = this.data.slice(this.pos, this.pos + length);
    this.pos += length;
    return out;
  }

  done(): boolean {
    return this.pos === this.data.length;
  }
}

export const toNumbers = (values: bigint[]): number[] => values.map(Number);
