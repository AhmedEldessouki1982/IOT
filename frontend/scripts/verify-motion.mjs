// Run against Vite and an isolated Chrome debugging endpoint. All API traffic is faked.
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.FRONTEND_URL || "http://127.0.0.1:5174";
const output = new URL("../docs/motion-captures/", import.meta.url);
await mkdir(output, { recursive: true });
const version = await (await fetch("http://127.0.0.1:9222/json/version")).json();
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise(resolve => ws.onopen = resolve);
let sequence = 0;
const pending = new Map();
const exceptions = [];
ws.onmessage = ({data}) => {
  const message = JSON.parse(data);
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
  const request = pending.get(message.id);
  if (request) { pending.delete(message.id); message.error ? request.reject(message.error) : request.resolve(message.result); }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, {resolve,reject});
  ws.send(JSON.stringify({id,method,params,sessionId}));
});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const results = [];
const setup = `
  localStorage.removeItem('iot.wallPanel');
  window.__commands=[]; window.__shifts=[];
  new PerformanceObserver(list=>window.__shifts.push(...list.getEntries().map(e=>({value:e.value,recent:e.hadRecentInput,sources:e.sources.map(s=>({html:(s.node?.outerHTML||s.node?.parentElement?.outerHTML)?.slice(0,200),previous:s.previousRect,current:s.currentRect}))})))).observe({type:'layout-shift',buffered:true});
  window.__fixtures=['light1','sonoff1','sonoff2','sonoff3'].map(deviceId=>({deviceId,type:'switch',state:{on:false},timestamp:new Date().toISOString()}));
  const originalFetch=window.fetch;
  window.fetch=async(input, options)=> {
    const url=typeof input==='string'?input:input.url;
    if(url.includes(':3000/')) {
      if(options?.method==='POST') window.__commands.push({url,body:options.body,at:performance.now()});
      const body=url.endsWith('/devices')?window.__fixtures:[];
      return new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
    }
    return originalFetch(input,options);
  };
`;
for (const width of [1440,390]) for (const reduced of [false,true]) {
  const {targetId}=await send("Target.createTarget",{url:"about:blank"});
  const {sessionId}=await send("Target.attachToTarget",{targetId,flatten:true});
  const call=(method,params={})=>send(method,params,sessionId);
  const evaluate=async expression=>{
    const response=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const report={width,reduced};
  const capture=async(name,delays=[0,90,300])=>{
    for(let i=0;i<delays.length;i++) {
      await pause(delays[i]);
      const {data}=await call("Page.captureScreenshot",{format:"jpeg",quality:70});
      await writeFile(new URL(`${width}-${reduced?'reduced':'motion'}-${name}-${i}.jpg`,output),Buffer.from(data,"base64"));
    }
  };
  const nav=async name=>{await evaluate(`[...document.querySelectorAll('.app-nav > button')].find(b=>b.textContent.trim()===${JSON.stringify(name)}).click()`);await pause(250);};
  await call("Runtime.enable"); await call("Page.enable");
  await call("Emulation.setDeviceMetricsOverride",{width,height:width===390?844:900,deviceScaleFactor:1,mobile:false});
  await call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:reduced?"reduce":"no-preference"}]});
  await call("Page.addScriptToEvaluateOnNewDocument",{source:setup});
  await call("Page.navigate",{url:base}); await pause(1400);
  await evaluate(`(async()=>{await document.fonts.ready; const mod=await import('/src/store/useHomeStore.ts'); window.__store=mod.useHomeStore; window.__socket=mod.homeSocket; mod.homeSocket.disconnect();mod.useHomeStore.setState({online:true,devices:Object.fromEntries(window.__fixtures.map(d=>[d.deviceId,d]))});})()`);
  await pause(400);
  report.fonts=await evaluate(`({family:getComputedStyle(document.body).fontFamily,loaded:[...document.fonts].some(f=>f.family==='Ubuntu'&&f.status==='loaded'),old:[...document.fonts].some(f=>/Manrope|Plex/.test(f.family))})`);
  report.initialInfinite=await evaluate(`document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity).length`);
  await nav("Rooms");
  report.initialRoomAnimations=await evaluate(`document.querySelectorAll('.device-motion[data-changed=true],.row-flash').length`);
  const light=`document.querySelector('[data-device-key="light1"] .toggle')`;
  await evaluate(`window.__shifts=[]; ${light}.click()`);
  await pause(35);
  report.lit=await evaluate(`({on:${light}.getAttribute('aria-checked'),animations:document.getAnimations().map(a=>a.animationName).filter(Boolean)})`);
  await capture("lit");
  await pause(1550);
  await evaluate(`window.__store.setState(s=>({devices:{...s.devices,light1:{...s.devices.light1,state:{on:false}}}}))`);
  await pause(25);
  report.external=await evaluate(`({flash:!!document.querySelector('[data-device-key="light1"] .row-flash'),announcement:document.querySelector('[data-device-key="light1"] [aria-live]').textContent})`);
  await capture("external");
  await evaluate(`document.querySelector('.lock-pill').click()`);
  await capture("lock");
  report.lock=await evaluate(`document.querySelector('.lock-pill').getAttribute('aria-label')`);
  report.interactionShift=await evaluate(`window.__shifts.reduce((sum,s)=>sum+s.value,0)`);
  report.shiftSources=await evaluate(`window.__shifts`);
  await evaluate(`window.__socket.listeners('timer:update').forEach(fn=>fn([{deviceId:'sonoff1',gang:1,expiresAt:new Date(Date.now()+45000).toISOString(),remainingSeconds:45,durationSeconds:600}]))`);
  await capture("timer");
  report.timer=await evaluate(`({text:document.querySelector('.timer-numerals')?.textContent,offset:document.querySelector('.timer-ring-value')?.getAttribute('stroke-dashoffset'),infinite:document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity).length})`);
  await evaluate(`window.__socket.listeners('timer:update').forEach(fn=>fn([]))`);
  await pause(250);
  await nav("Home");
  await evaluate(`document.querySelector('.scene-button').click()`);
  await capture("scene");
  report.scene=await evaluate(`({state:document.querySelector('.scene-button').dataset.state,commands:window.__commands.length,announcement:document.querySelector('.scene-action [role=status]').textContent})`);
  await pause(1300);
  report.settledInfinite=await evaluate(`document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity).length`);
  // Keyboard activation must open the explicit confirmation without dispatching.
  report.confirm=await evaluate(`(()=>{const before=window.__commands.length;document.querySelector('.shutdown-btn').click();return {before};})()`);
  await pause(100);
  report.confirm.open=await evaluate(`!!document.querySelector('dialog[open]')`);
  report.confirm.noCommands=await evaluate(`window.__commands.length===${report.confirm.before}`);
  await evaluate(`document.querySelector('.shutdown-dialog button').click()`);
  const holdPoint=await evaluate(`(()=>{const r=document.querySelector('.shutdown-btn').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const beforeHold=await evaluate(`window.__commands.length`);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...holdPoint,button:'left',clickCount:1});
  await pause(200);
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',...holdPoint,button:'left',clickCount:1});
  await pause(100);
  report.shortHoldCancelled=await evaluate(`window.__commands.length===${beforeHold}`);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',...holdPoint,button:'left',clickCount:1});
  await pause(1250);
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',...holdPoint,button:'left',clickCount:1});
  await pause(100);
  report.fullHoldApplied=await evaluate(`window.__commands.length>${beforeHold}`);
  report.views=[];
  for(const theme of ['light','dark']) {
    await evaluate(`document.documentElement.dataset.theme='${theme}'`);
    for(const view of ['Home','Rooms','Scenes','Security','Devices','Activity','Settings']) {
      await nav(view);
      report.views.push({theme,view,...await evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,small:[...document.querySelectorAll('button,input,select')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44}).map(e=>e.getAttribute('aria-label')||e.textContent.trim())})`)});
    }
  }
  // Accelerate only the one-minute idle timeout; use the production state machine/listeners.
  await call("Page.addScriptToEvaluateOnNewDocument",{source:`localStorage.setItem('iot.wallPanel',JSON.stringify({enabled:true,minutes:1}));const nativeTimeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===60000?2500:ms,...args);`});
  await call("Page.navigate",{url:base+'?kiosk=1'}); await pause(1200);
  await evaluate(`(async()=>{const m=await import('/src/store/useHomeStore.ts');window.__store=m.useHomeStore;m.homeSocket.disconnect();m.useHomeStore.setState({online:true});})()`);
  await nav("Rooms");
  await pause(3000);
  report.idle=await evaluate(`!!document.querySelector('.kiosk-overlay')`);
  await capture("idle",[0]);
  const point=await evaluate(`(()=>{const r=document.querySelector('[data-device-key="light1"] .toggle').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const before=await evaluate(`window.__commands.length`);
  await call("Input.dispatchMouseEvent",{type:"mousePressed",...point,button:"left",clickCount:1});
  await call("Input.dispatchMouseEvent",{type:"mouseReleased",...point,button:"left",clickCount:1});
  await capture("wake",[0,200,1600]);
  report.wake=await evaluate(`({asleep:!!document.querySelector('.kiosk-overlay'),noCommand:window.__commands.length===${before}})`);
  await pause(3000);
  const beforeKeyboard=await evaluate(`window.__commands.length`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await pause(250);
  report.keyboardWake=await evaluate(`({asleep:!!document.querySelector('.kiosk-overlay'),noCommand:window.__commands.length===${beforeKeyboard}})`);
  results.push(report);
  await send("Target.closeTarget",{targetId});
}
await writeFile(new URL("results.json",output),JSON.stringify({results,exceptions},null,2)+"\n");
console.log(JSON.stringify({configurations:results.length,views:results.reduce((n,r)=>n+r.views.length,0),results:results.map(({views,shiftSources,...r})=>r),exceptions},null,2));
ws.close();
if(exceptions.length || results.some(r=>!r.fonts.loaded||r.fonts.old||r.initialInfinite||r.initialRoomAnimations||r.settledInfinite||!r.external.flash||!r.idle||!r.wake.noCommand||r.wake.asleep||!r.keyboardWake.noCommand||r.keyboardWake.asleep||!r.shortHoldCancelled||!r.fullHoldApplied||!r.confirm.open||!r.confirm.noCommands||(r.reduced&&(r.lit.animations.length||r.timer.infinite))||r.views.some(v=>v.overflow||v.small.length))) process.exitCode=1;
