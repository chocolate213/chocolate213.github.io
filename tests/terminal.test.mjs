import test from 'node:test';
import assert from 'node:assert/strict';
import { runCommand, tokenize, resolvePath, completions } from '../site/terminal.mjs';
const state = () => ({ cwd: '/', theme: 'green', history: [] });
const output = result => result.lines.map(line => line.text).join('\n');

test('profile and project commands show the intended public content', () => {
  const shell = state();
  assert.match(output(runCommand('whoami', shell)), /Jiaxing Zhang/);
  assert.match(output(runCommand('projects', shell)), /stay-awake[\s\S]*json-formatter/);
  assert.match(output(runCommand('project json-formatter', shell)), /without leaving your IDE or creating a new file/);
  assert.match(output(runCommand('contact', shell)), /chocolatepie213@gmail.com/);
});

test('virtual navigation handles relative paths and cannot access host files', () => {
  const shell = state();
  runCommand('cd projects/stay-awake', shell);
  assert.equal(shell.cwd, '/projects/stay-awake');
  assert.match(output(runCommand('cat README.md', shell)), /Stay Awake/);
  runCommand('cd ../json-formatter', shell);
  assert.match(output(runCommand('cat README.md', shell)), /JSON Formatter/);
  assert.equal(resolvePath(shell.cwd, '../../../../'), '/');
  const before = shell.cwd;
  assert.match(output(runCommand('cd /etc', shell)), /no such directory/);
  assert.equal(shell.cwd, before);
  assert.match(output(runCommand('cat /etc/passwd', shell)), /no such file/);
  runCommand('cd', shell);
  assert.equal(shell.cwd, '/');
});

test('listed entries work from a different current directory', () => {
  const shell = state();
  const item = runCommand('ls ~/projects', shell).lines.find(line => line.text === 'stay-awake/');
  runCommand(item.command, shell);
  assert.equal(shell.cwd, '/projects/stay-awake');
  const about = runCommand('ls ~', shell).lines.find(line => line.text === 'about.txt');
  assert.match(output(runCommand(about.command, shell)), /Jiaxing Zhang/);
});

test('quoted and malicious-looking text stays data, never a command or URL', () => {
  assert.deepEqual(tokenize('echo "hello world" \'one two\''), ['echo', 'hello world', 'one two']);
  const shell = state();
  assert.match(output(runCommand('echo "unfinished', shell)), /Unclosed quote/);
  const payload = '<img src=x onerror=alert(1)>';
  assert.equal(output(runCommand(`echo '${payload}'`, shell)), payload);
  assert.equal(output(runCommand('echo $(whoami)', shell)), '$(whoami)');
  for (const raw of ['open javascript:alert(1)', 'open https://example.com', 'open ../../', 'open stay-awake --bad']) {
    assert.equal(runCommand(raw, shell).action, undefined);
  }
  assert.match(output(runCommand('rm -rf /', shell)), /command not found/);
});

test('opening projects only resolves to known public destinations', () => {
  const shell = state();
  assert.equal(runCommand('open stay-awake', shell).url, 'https://chocolate213.github.io/stay-awake/');
  assert.equal(runCommand('open json-formatter --source', shell).url, 'https://github.com/chocolate213/json-formatter');
  assert.equal(runCommand('open github', shell).url, 'https://github.com/chocolate213');
});

test('completion, theme validation and history support the interactive shell', () => {
  assert.deepEqual(completions('who', '/'), ['whoami']);
  assert.deepEqual(completions('open json', '/'), ['open json-formatter']);
  assert.deepEqual(completions('cat RE', '/projects/stay-awake'), ['cat README.md']);
  const shell = state();
  assert.equal(runCommand('theme amber', shell).theme, 'amber');
  assert.match(output(runCommand('theme invalid', shell)), /Usage:/);
  assert.equal(shell.theme, 'amber');
  shell.history = ['whoami', 'projects'];
  assert.match(output(runCommand('history', shell)), /1  whoami\n\s*2  projects/);
  assert.equal(runCommand('clear', shell).action, 'clear');
});
