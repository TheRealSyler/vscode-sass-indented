import { runTests } from 'vscode-test';
import { resolve } from 'path';

async function main() {
  try {
    const extensionDevelopmentPath = resolve(__dirname, '../../');
    const extensionTestsPath = resolve(__dirname, './index.js');

    await runTests({
      version: '1.43.0',
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ['--disable-extensions', '-n'],
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
