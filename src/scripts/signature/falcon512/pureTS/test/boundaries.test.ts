import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// lib/ must stay browser-safe and independent from the workshop, to be copied as-is into starknet.js.
const LIB = path.join(__dirname, '..', 'lib');
const ALLOWED_PACKAGES = ['@noble/ciphers', '@noble/curves', '@noble/hashes', '@scure/starknet', 'starknet'];
const FILES_ALLOWED_TO_IMPORT_STARKNET = ['Falcon512Signer.ts', 'verify.ts'];

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) files.push(...listTsFiles(p));
    else if (p.endsWith('.ts')) files.push(p);
  }
  return files;
}

// Real import/export statements only (they start a line); examples inside doc comments start with " * ".
const importSpecifiers = (source: string): string[] =>
  [...source.matchAll(/^(?:import|export)\s[^;]*?\sfrom\s+'([^']+)'/gm)].map((m) => m[1]);

const libFiles = listTsFiles(LIB);

describe('lib/ boundaries', () => {
  test('relative imports stay inside lib/ and packages are in the allow-list', () => {
    const violations: string[] = [];
    for (const file of libFiles) {
      const name = path.relative(LIB, file);
      for (const specifier of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (specifier.startsWith('.')) {
          if (!path.resolve(path.dirname(file), specifier).startsWith(LIB)) {
            violations.push(`${name}: import '${specifier}' leaves lib/`);
          }
        } else if (!ALLOWED_PACKAGES.some((pkg) => specifier === pkg || specifier.startsWith(pkg + '/'))) {
          violations.push(`${name}: package '${specifier}' is not allowed`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test('only Falcon512Signer.ts and verify.ts import starknet', () => {
    const violations: string[] = [];
    for (const file of libFiles) {
      const importsStarknet = importSpecifiers(readFileSync(file, 'utf8')).includes('starknet');
      if (importsStarknet && !FILES_ALLOWED_TO_IMPORT_STARKNET.includes(path.basename(file))) {
        violations.push(`${path.relative(LIB, file)}: imports 'starknet'`);
      }
    }
    expect(violations).toEqual([]);
  });

  test('no Node-only API and no console output outside the vendored noble copy', () => {
    const violations: string[] = [];
    for (const file of libFiles) {
      if (file.includes(`${path.sep}noble${path.sep}`)) continue;
      const source = readFileSync(file, 'utf8');
      if (/\b(Buffer|process|require)\s*[.(]/.test(source)) violations.push(`${path.relative(LIB, file)}: Node-only API`);
      if (/console\.(log|info|debug)/.test(source)) violations.push(`${path.relative(LIB, file)}: console output`);
    }
    expect(violations).toEqual([]);
  });

  test('lib/s2morrow keeps no module-level cache (secret-derived values would outlive their use)', () => {
    const violations: string[] = [];
    for (const file of libFiles) {
      if (!file.includes(`${path.sep}s2morrow${path.sep}`)) continue;
      const source = readFileSync(file, 'utf8');
      for (const m of source.matchAll(/^(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*new\s+(?:Map|Set|WeakMap)\b/gm)) {
        violations.push(`${path.relative(LIB, file)}: module-level cache '${m[1]}'`);
      }
    }
    expect(violations).toEqual([]);
  });
});
