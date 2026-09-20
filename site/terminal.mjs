// Curated from public GitHub profile and pinned repositories. No runtime API access.
export const PROFILE = Object.freeze({
  name: 'Jiaxing Zhang', username: 'chocolate213',
  github: 'https://github.com/chocolate213', email: 'chocolatepie213@gmail.com'
});
export const PROJECTS = Object.freeze([
  { slug: 'stay-awake', name: 'Stay Awake', platform: 'macOS · Objective-C / AppKit',
    description: 'Keep your Mac awake while local AI agents work.',
    details: ['Timed sessions, a menu bar countdown, and quick extensions.', 'Choose a duration, a finish time, or stay awake until stopped.'],
    site: 'https://chocolate213.github.io/stay-awake/', repo: 'https://github.com/chocolate213/stay-awake' },
  { slug: 'json-formatter', name: 'JSON Formatter', platform: 'JetBrains IDEs · Java',
    description: 'Work with JSON without leaving your IDE or creating a new file.',
    details: ['Format, minify, validate, escape, and unescape JSON.', 'A dedicated tool window, right beside your code.'],
    site: 'https://chocolate213.github.io/json-formatter/', repo: 'https://github.com/chocolate213/json-formatter' }
]);
export const COMMANDS = ['help','whoami','projects','project','open','github','contact','ls','cd','pwd','cat','theme','history','clear','welcome','date','echo','coffee'];
const ABOUT = `Jiaxing Zhang / @chocolate213

Small tools. Fewer detours.

Stay Awake keeps a Mac awake while local AI agents work.
JSON Formatter keeps JSON tasks inside the IDE.

This is my little corner of the internet.
Take a look around. Everything here comes from my public GitHub.`;
const row = (text = '', tone = '') => ({ text, tone });
const link = (text, href) => ({ text, href, tone: 'link' });
const command = (text, value = text) => ({ text, command: value });
const error = text => ({ lines: [row(text, 'error')] });
const projectByName = value => PROJECTS.find(project => project.slug === value);
export function tokenize(raw) {
  const tokens = []; let token = '', quote = '', escaped = false, started = false;
  for (const char of raw.trim()) {
    if (escaped) { token += char; escaped = false; started = true; continue; }
    if (char === '\\' && quote !== "'") { escaped = true; started = true; continue; }
    if (quote) { if (char === quote) quote = ''; else token += char; continue; }
    if (char === '"' || char === "'") { quote = char; started = true; continue; }
    if (/\s/.test(char)) { if (started) { tokens.push(token); token = ''; started = false; } }
    else { token += char; started = true; }
  }
  if (quote) throw new Error('Unclosed quote. Close it and try again.');
  if (escaped) token += '\\';
  if (started) tokens.push(token);
  return tokens;
}
export function resolvePath(cwd, path = '~') {
  const rooted = path.startsWith('~') || path.startsWith('/');
  const pieces = rooted ? [] : cwd.split('/').filter(Boolean);
  for (const piece of path.replace(/^~(?=\/|$)/,'').split('/')) {
    if (!piece || piece === '.') continue;
    if (piece === '..') pieces.pop(); else pieces.push(piece);
  }
  return '/' + pieces.join('/');
}
export const displayPath = cwd => cwd === '/' ? '~' : '~' + cwd;
function directoryExists(path) { return path === '/' || path === '/projects' || PROJECTS.some(p => path === '/projects/' + p.slug); }
function readFile(path) {
  if (path === '/about.txt' || path === '/README.md') return ABOUT;
  if (path === '/contact.txt') return `${PROFILE.github}
${PROFILE.email}`;
  if (path === '/projects/README.md') return 'Two featured public projects.\nRun projects, or cd into a project and cat README.md.';
  const project = PROJECTS.find(p => path === `/projects/${p.slug}/README.md`);
  if (project) return [project.name, project.platform, '', project.description, ...project.details, '', project.site, project.repo].join('\n');
  return null;
}
function projectLines(project) {
  return [row(project.name, 'heading'), row(project.platform, 'dim'), row(), row(project.description), ...project.details.map(text => row(text)), row(), link('website  ' + project.site, project.site), link('source   ' + project.repo, project.repo)];
}
export function runCommand(raw, state) {
  let tokens; try { tokens = tokenize(raw); } catch (e) { return error(e.message); }
  const [name, ...args] = tokens;
  if (!name) return { lines: [] };
  const extra = max => args.length > max;
  switch (name) {
    case 'help': return { lines: [row('A small shell for a small corner of the internet.', 'heading'), row('Click a command, or type it below.','dim'), row(),
      command('whoami                   the person behind the prompt','whoami'), command('projects                 featured public projects','projects'),
      command('project stay-awake       read about a project','project stay-awake'), command('open json-formatter      open a project website','open json-formatter'),
      command('contact                  public contact links','contact'), command('github                   GitHub profile','github'), row(),
      command('ls / cd / pwd / cat      explore the virtual files','ls'), command('theme                    green, amber, or ice','theme'),
      command('history                  commands from this tab','history'), command('clear                    start with a clean screen','clear'),
      command('welcome                  show the welcome message','welcome'), command('date                     your local date and time','date'),
      row(), row('Tab completes · ↑/↓ recall · Ctrl+L clears · Ctrl+C cancels','dim'), row('This is a browser shell, not access to a real computer.','dim') ] };
    case 'whoami': return { lines: [row(PROFILE.name,'heading'), row('@' + PROFILE.username,'accent'), row(), row('Building small tools for developer workflows.'), link(PROFILE.github, PROFILE.github), row(), command('Explore my work → projects','projects')] };
    case 'projects':
      if (args.length && (args[0] !== '--all' || extra(1))) return error('Usage: projects [--all]');
      if (args[0] === '--all') return {lines:[row('Browse the public repositories on GitHub:'),link(PROFILE.github+'?tab=repositories', PROFILE.github+'?tab=repositories')]};
      return {lines:[row('~/projects · 2 featured public projects','heading'),row(), ...PROJECTS.flatMap((p,i)=>[command(`${String(i+1).padStart(2,'0')}  ${p.slug}/`, 'project '+p.slug),row('    '+p.description),row('    '+p.platform,'dim'),row()]), row('Read more: project <name>  |  Visit: open <name>','dim'),command('All public repositories → projects --all','projects --all')]};
    case 'project': {
      if (args.length !== 1) return error('Usage: project <stay-awake | json-formatter>');
      const project = projectByName(args[0]);
      return project ? {lines:projectLines(project)} : error(`No featured project named "${args[0]}". Try projects.`);
    }
    case 'open': {
      if (!args.length || extra(2) || (args[1] && args[1] !== '--source')) return error('Usage: open <stay-awake | json-formatter | github> [--source]');
      const project = projectByName(args[0]);
      const url = args[0] === 'github' ? PROFILE.github : project ? (args[1] === '--source' ? project.repo : project.site) : null;
      return url ? {action:'open',url,lines:[row('Opening in a new tab. If it was blocked, use this link:','dim'),link(url,url)]} : error('Unknown destination. Try open stay-awake or open json-formatter.');
    }
    case 'github': return {lines:[link(PROFILE.github,PROFILE.github)]};
    case 'contact': return {lines:[row('Say hello.','heading'),row('Public contact details from my GitHub profile.','dim'),row(),link('github  '+PROFILE.github,PROFILE.github),link('email   '+PROFILE.email,'mailto:'+PROFILE.email)]};
    case 'pwd': return {lines:[row(displayPath(state.cwd)),row('(virtual directory in this browser)','dim')]};
    case 'cd': {
      if (extra(1)) return error('Usage: cd [directory]');
      const path = resolvePath(state.cwd,args[0]);
      if (!directoryExists(path)) return error(`cd: no such directory: ${args[0]}`);
      state.cwd = path; return {lines:[]};
    }
    case 'ls': {
      if (extra(1)) return error('Usage: ls [directory]');
      const path = resolvePath(state.cwd,args[0] ?? '.');
      if (!directoryExists(path)) return error(`ls: no such directory: ${args[0]}`);
      if (path === '/') return {lines:[command('projects/','cd ~/projects'),command('about.txt','cat ~/about.txt'),command('contact.txt','cat ~/contact.txt'),command('README.md','cat ~/README.md')]};
      if (path === '/projects') return {lines:[...PROJECTS.map(p=>command(p.slug+'/','cd ~/projects/'+p.slug)),command('README.md','cat ~/projects/README.md')]};
      return {lines:[command('README.md','cat ~'+path+'/README.md'),row('Tip: open '+path.split('/').pop()+' visits the website.','dim')]};
    }
    case 'cat': {
      if (args.length !== 1) return error('Usage: cat <file>');
      const text = readFile(resolvePath(state.cwd,args[0]));
      return text === null ? error(`cat: no such file: ${args[0]}`) : {lines:text.split('\n').map(text=>row(text))};
    }
    case 'theme': {
      if (!args.length) return {lines:[row('Pick a phosphor. Same terminal, a different glow.','heading'),row(),...['green','amber','ice'].map(t=>command(`theme ${t}${state.theme===t?'  ← current':''}`,'theme '+t))]};
      if (extra(1) || !['green','amber','ice'].includes(args[0])) return error('Usage: theme <green | amber | ice>');
      state.theme=args[0];return {theme:args[0],lines:[row('Theme set to '+args[0]+'.','accent')]};
    }
    case 'clear': return {action:'clear',lines:[]};
    case 'welcome': return {action:'welcome',lines:[]};
    case 'history': return {lines: state.history.length ? state.history.map((value,i)=>row(`${String(i+1).padStart(3,' ')}  ${value}`)) : [row('No commands yet.','dim')]};
    case 'date': return {lines:[row(new Date().toLocaleString()),row('Your browser’s local time.','dim')]};
    case 'echo': return {lines:[row(args.join(' '))]};
    case 'coffee': return {lines:[row('   ( (','ascii'),row('    ) )','ascii'),row('  .------.','ascii'),row('  |      |]','ascii'),row("  \`------'",'ascii'),row('   coffee → code → repeat','dim')]};
    case 'sudo': return {lines:[row('No elevated privileges needed. Just curiosity.','accent'),command('Try help','help')]};
    default: {
      const suggestion = COMMANDS.find(c=>c.startsWith(name) || (name.length>3 && c.startsWith(name.slice(0,-1))));
      return {lines:[row(`command not found: ${name}`,'error'),suggestion?command('Did you mean '+suggestion+'?',suggestion):command('Type help to see the available commands.','help')]};
    }
  }
}
export function completions(value, cwd) {
  const space = value.indexOf(' ');
  if (space < 0) return COMMANDS.filter(c=>c.startsWith(value));
  const name=value.slice(0,space),prefix=value.slice(space+1);
  let choices=[];
  if (['project','open'].includes(name)) choices=PROJECTS.map(p=>p.slug).concat(name==='open'?['github']:[]);
  else if (name==='theme') choices=['green','amber','ice'];
  else if (['cd','ls','cat'].includes(name)) {
    const dirs=['~','~/projects',...PROJECTS.map(p=>'~/projects/'+p.slug)];
    const local=cwd==='/'?['projects','about.txt','contact.txt','README.md']:cwd==='/projects'?PROJECTS.map(p=>p.slug).concat('README.md'):['README.md'];
    choices=name==='cd'?local.filter(f=>!f.includes('.')).concat(dirs):local.concat(dirs,['~/about.txt','~/contact.txt']);
  }
  return [...new Set(choices)].filter(c=>c.startsWith(prefix)).map(c=>name+' '+c);
}
