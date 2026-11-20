import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
} from 'vscode-jsonrpc/node.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const languages = {
  '.css': 'css',
  '.html': 'html',
  '.ts': 'typescript',
  '.tsx': 'typescriptreact',
};
const settings = {
  tailwindCSS: {
    validate: true,
    lint: { suggestCanonicalClasses: 'warning' },
    experimental: { configFile: 'src/index.css' },
  },
};

const sources = await readdir(join(root, 'src'), { recursive: true, withFileTypes: true });
const files = sources
  .filter((entry) => entry.isFile() && Object.hasOwn(languages, extname(entry.name)))
  .map((entry) => join(entry.parentPath, entry.name));
files.push(join(root, 'index.html'));

const documents = await Promise.all(
  files.sort().map(async (file) => ({
    uri: pathToFileURL(file).href,
    languageId: languages[extname(file)],
    version: 1,
    text: await readFile(file, 'utf8'),
  })),
);

const server = spawn(
  process.execPath,
  [require.resolve('@tailwindcss/language-server/bin/tailwindcss-language-server'), '--stdio'],
  { cwd: root, stdio: ['pipe', 'pipe', 'inherit'] },
);
const connection = createMessageConnection(
  new StreamMessageReader(server.stdout),
  new StreamMessageWriter(server.stdin),
);
const pending = new Set(documents.map(({ uri }) => uri));
const diagnostics = [];
let lastServerMessage = '';
let projectInitialized = false;

connection.onRequest('workspace/configuration', ({ items }) =>
  items.map(({ section }) => (section ? (settings[section] ?? {}) : settings)),
);
// The checker reads a single snapshot, so watcher registrations need no follow-up events.
connection.onRequest('client/registerCapability', () => null);
connection.onNotification('window/logMessage', ({ message }) => {
  lastServerMessage = message;
});
connection.onNotification('@/tailwindCSS/projectInitialized', () => {
  projectInitialized = true;
});
const completed = new Promise((resolve) => {
  connection.onNotification('textDocument/publishDiagnostics', ({ uri, diagnostics: list }) => {
    if (!pending.delete(uri)) return;
    diagnostics.push(...list.map((diagnostic) => ({ ...diagnostic, uri })));
    if (pending.size === 0) resolve();
  });
});
connection.listen();

let timeout;
try {
  await Promise.race([
    new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting for Tailwind diagnostics. ${lastServerMessage}`));
      }, 30_000);
      server.once('error', reject);
      server.once('exit', (code) => reject(new Error(`Tailwind server exited early (${code}).`)));
    }),
    (async () => {
      await connection.sendRequest('initialize', {
        processId: process.pid,
        rootUri: pathToFileURL(root).href,
        capabilities: {
          workspace: { configuration: true, didChangeWatchedFiles: { dynamicRegistration: true } },
        },
      });
      await connection.sendNotification('initialized', {});
      for (const textDocument of documents) {
        await connection.sendNotification('textDocument/didOpen', { textDocument });
      }
      await completed;
    })(),
  ]);
  if (!projectInitialized) {
    throw new Error(`Tailwind did not initialize src/index.css. ${lastServerMessage}`);
  }

  diagnostics.sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character,
  );
  for (const { uri, range, code, message } of diagnostics) {
    const file = relative(root, fileURLToPath(uri));
    console.error(
      `${file}:${range.start.line + 1}:${range.start.character + 1} [${code}] ${message}`,
    );
  }
  console.log(
    `Tailwind CSS IntelliSense: ${files.length} files checked, ${diagnostics.length} diagnostics.`,
  );
  if (diagnostics.length > 0) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  connection.dispose();
  server.kill();
}
