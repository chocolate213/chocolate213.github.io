import { PROFILE, PROJECTS, runCommand, completions, displayPath } from './terminal.mjs?v=c4bd7fae62';
const output=document.querySelector('#output');
const form=document.querySelector('#command-form');
const input=document.querySelector('#command');
const announcement=document.querySelector('#announcement');
const state={cwd:'/',theme:'ice',history:[]};
let historyIndex=0,draft='';
try { const saved=localStorage.getItem('jiaxing-terminal-theme');if(['green','amber','ice'].includes(saved))state.theme=saved; } catch {}
document.documentElement.dataset.theme=state.theme;
function element(tag,text,className='') {
  const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;
}
function commandButton(text,command) {
  const el=element('button',text);el.type='button';el.dataset.command=command;return el;
}
function publicLink(text, href) {
  const link=element('a',text);link.href=href;link.target='_blank';link.rel='noopener noreferrer';return link;
}
function welcome() {
  const block=element('section','','welcome');block.setAttribute('aria-label','Welcome');
  block.append(element('h1',"Welcome to Jiaxing Zhang's terminal.",'welcome-title'));
  const links=element('div','','welcome-group welcome-links');
  for (const [label,content] of [
    ['GitHub:',publicLink(PROFILE.github,PROFILE.github)],
    ['Projects:',commandButton("type 'projects'",'projects')],
    ['Help:',commandButton("type 'help'",'help')]
  ]) {
    const row=element('div','','welcome-row');row.append(element('span','* '+label,'welcome-label'),content);links.append(row);
  }
  block.append(links);
  const profile=element('div','','welcome-group');profile.append(element('h2','Profile','welcome-heading'));
  for (const [label,value] of [['Name:',PROFILE.name],['Username:',PROFILE.username]]) {
    const row=element('div','','welcome-row profile-row');row.append(element('span',label,'welcome-label'),element('span',value));profile.append(row);
  }
  block.append(profile);
  const projects=element('div','','welcome-group');projects.append(element('h2','Featured projects','welcome-heading'));
  for (const project of PROJECTS) {
    const row=element('div','','welcome-row project-row');
    row.append(commandButton(project.slug,'project '+project.slug),element('span',project.description,'project-description'));projects.append(row);
  }
  block.append(projects);
  const hints=element('div','','welcome-group welcome-hints');
  const first=element('p','');first.append(document.createTextNode("Type '"),commandButton('whoami','whoami'),document.createTextNode("' to get started."));
  hints.append(first,element('p','Use Tab to complete commands, or ↑ / ↓ to browse history.'));
  block.append(hints);output.append(block);
}
function commandEcho(raw,cwd=displayPath(state.cwd)) {
  const line=element('div','','command-echo');
  line.append(element('span','guest@jiaxing:'+cwd+'$','echo-prefix'),document.createTextNode(' '+raw));
  return line;
}
function drawLines(parent,lines) {
  for (const item of lines) {
    const line=element('div','', 'output-line '+(item.tone||''));
    if(item.href){const a=element('a',item.text);a.href=item.href;if(item.href.startsWith('https://')){a.target='_blank';a.rel='noopener noreferrer';}line.append(a);}
    else if(item.command)line.append(commandButton(item.text,item.command));
    else line.textContent=item.text;
    parent.append(line);
  }
}
function execute(value) {
  const raw=value.trim();if(!raw)return;
  const cwd=displayPath(state.cwd);
  state.history.push(raw);if(state.history.length>100)state.history.shift();historyIndex=state.history.length;draft='';
  const result=runCommand(raw,state);
  if(result.action==='open')window.open(result.url,'_blank','noopener,noreferrer');
  if(result.theme){document.documentElement.dataset.theme=result.theme;try{localStorage.setItem('jiaxing-terminal-theme',result.theme);}catch{}}
  if(result.action==='clear')output.replaceChildren();
  else {
    const block=element('section','','entry');block.setAttribute('aria-label','Command: '+raw);
    block.append(commandEcho(raw,cwd));
    drawLines(block,result.lines);output.append(block);
    if(result.action==='welcome')welcome();
  }
  while(output.children.length>150)output.firstElementChild.remove();
  document.querySelector('#cwd').textContent=displayPath(state.cwd);
  input.value='';announcement.textContent=result.action==='clear'?'Terminal cleared.':result.lines.map(l=>l.text).join('\n')||'Directory: '+displayPath(state.cwd);
  input.focus({preventScroll:true});form.scrollIntoView({block:'nearest',behavior:'instant'});
}
form.addEventListener('submit',event=>{event.preventDefault();execute(input.value);});
document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-command]');
  if(button)execute(button.dataset.command);
});
input.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  if(event.ctrlKey&&event.key.toLowerCase()==='l'){event.preventDefault();output.replaceChildren();announcement.textContent='Terminal cleared.';return;}
  if(event.ctrlKey&&event.key.toLowerCase()==='c'){
    event.preventDefault();const line=commandEcho(input.value+'^C');output.append(line);input.value='';historyIndex=state.history.length;draft='';announcement.textContent='Input cancelled.';return;
  }
  if(event.key==='ArrowUp'||event.key==='ArrowDown'){
    event.preventDefault();if(historyIndex===state.history.length)draft=input.value;
    historyIndex=Math.max(0,Math.min(state.history.length,historyIndex+(event.key==='ArrowUp'?-1:1)));
    input.value=historyIndex===state.history.length?draft:state.history[historyIndex];input.setSelectionRange(input.value.length,input.value.length);return;
  }
  if(event.key==='Tab'&&!event.shiftKey){
    event.preventDefault();const matches=completions(input.value,state.cwd);
    if(matches.length===1){input.value=matches[0];input.setSelectionRange(input.value.length,input.value.length);announcement.textContent='Completed: '+input.value;}
    else if(matches.length){const line=element('div',matches.join('    '),'output-line dim');output.append(line);announcement.textContent='Matches: '+matches.join(', ');form.scrollIntoView({block:'nearest',behavior:'instant'});}
    else announcement.textContent='No completions.';
  }
});
welcome();
if(matchMedia('(pointer:fine)').matches)input.focus({preventScroll:true});
