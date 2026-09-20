const tabs = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const tab = tabs.find((item) => item.type === "page" && item.url.includes("localhost:5173")) ?? tabs.find((item) => item.type === "page");
if (!tab) throw new Error("No browser tab is available.");
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => { const message = JSON.parse(event.data); if (!message.id) return; const entry = pending.get(message.id); if (!entry) return; pending.delete(message.id); if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result); });
function call(method, params = {}) { return new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); }); }
async function evaluate(expression, awaitPromise = false) { const result = await call("Runtime.evaluate", { expression, awaitPromise, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; }
const pause = (milliseconds = 500) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const testTitle = `Offline test rockfall ${Date.now()}`;
async function waitFor(expression, timeout = 10000) { const started = Date.now(); while (Date.now() - started < timeout) { if (await evaluate(expression)) return; await pause(200); } throw new Error(`Timed out: ${expression}`); }
async function clickText(text, selector = "button") { const clicked = await evaluate(`(() => { const item=[...document.querySelectorAll(${JSON.stringify(selector)})].find((node)=>node.textContent?.includes(${JSON.stringify(text)})); item?.click(); return Boolean(item); })()`); if (!clicked) throw new Error(`Could not click ${text}`); await pause(500); }

await call("Runtime.enable"); await call("Page.enable"); await call("Network.enable");
await call("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await call("Page.navigate", { url: "http://localhost:5173" }); await waitFor("document.readyState === 'complete'"); await waitFor("Boolean(document.querySelector('[aria-label*=\"Open Annapurna\"]'))");
await evaluate(`navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>true)`, true);
await call("Page.reload", { ignoreCache: false }); await pause(1200); await waitFor("Boolean(navigator.serviceWorker.controller)"); await waitFor("Boolean(document.querySelector('[aria-label*=\"Open Annapurna\"]'))");
await evaluate(`document.querySelector('[aria-label*="Open Annapurna"]')?.click()`); await waitFor("document.body.innerText.includes('Download trail offline') || document.body.innerText.includes('Available offline')");
if (await evaluate("document.body.innerText.includes('Download trail offline')")) await clickText("Download", ".offline-download button");
await waitFor("document.body.innerText.includes('Available offline')");
const downloaded = await evaluate(`new Promise((resolve,reject)=>{const r=indexedDB.open('my-sherpa-offline');r.onsuccess=()=>{const q=r.result.transaction('routes').objectStore('routes').get('annapurna-base-camp');q.onsuccess=()=>resolve(Boolean(q.result));q.onerror=()=>reject(q.error)}})`, true);

await call("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await call("Page.reload", { ignoreCache: false }); await pause(1400); await waitFor("Boolean(document.querySelector('[aria-label*=\"Open Annapurna\"]'))"); await evaluate(`document.querySelector('[aria-label*="Open Annapurna"]')?.click()`); await waitFor("document.body.innerText.includes('Available offline')");
await clickText("Report hazard"); await waitFor("Boolean(document.querySelector('.field-report'))");
await evaluate(`(() => { navigator.geolocation.getCurrentPosition=(_success,error)=>error({code:1}); const title=document.querySelector('input[placeholder*="Fresh rockfall"]'); const detail=document.querySelector('textarea[placeholder*="trail passable"]'); for (const [node,value] of [[title,${JSON.stringify(testTitle)}],[detail,'Loose stone covers the uphill edge. Pass with caution and verify locally.']]) { const prototype=node.tagName==='INPUT'?HTMLInputElement.prototype:HTMLTextAreaElement.prototype; const setter=Object.getOwnPropertyDescriptor(prototype,'value').set; setter.call(node,value); node.dispatchEvent(new Event('input',{bubbles:true})); } document.querySelector('.field-fix button')?.click(); })()`);
await pause(1000);
if (await evaluate("document.body.innerText.includes('Use a marked demo fix')")) await clickText("Use a marked demo fix");
const documentNode = await call("DOM.getDocument", { depth: -1, pierce: true });
const inputNode = await call("DOM.querySelector", { nodeId: documentNode.root.nodeId, selector: 'input[type="file"]' });
await call("DOM.setFileInputFiles", { nodeId: inputNode.nodeId, files: ["C:\\Users\\anupa\\Documents\\Codex\\2026-09-19\\MySherpa\\public\\report-landslide-demo.webp"] });
await pause(1200);
if (await evaluate("document.body.innerText.includes('Use a marked demo fix')")) await clickText("Use a marked demo fix");
await waitFor(`(() => { const button=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('Submit for verification')); return Boolean(button && !button.disabled); })()`); await clickText("Submit for verification"); await pause(900);
const savedBeforeRefresh = await evaluate(`new Promise((resolve,reject)=>{const r=indexedDB.open('my-sherpa-offline');r.onsuccess=()=>{const q=r.result.transaction('reports').objectStore('reports').getAll();q.onsuccess=()=>resolve(q.result.some(x=>x.title===${JSON.stringify(testTitle)}&&x.syncStatus==='pending'));q.onerror=()=>reject(q.error)}})`, true);
if (!savedBeforeRefresh) throw new Error("Offline report was not persisted before refresh.");
await call("Page.reload"); await pause(1400);
const survivesRefresh = await evaluate(`new Promise((resolve,reject)=>{const r=indexedDB.open('my-sherpa-offline');r.onsuccess=()=>{const q=r.result.transaction('reports').objectStore('reports').getAll();q.onsuccess=()=>resolve(q.result.some(x=>x.title===${JSON.stringify(testTitle)}));q.onerror=()=>reject(q.error)}})`, true);
await call("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await evaluate("Object.defineProperty(Navigator.prototype,'onLine',{configurable:true,get:()=>true}); window.dispatchEvent(new Event('online'))"); await pause(600); await clickText("Community"); await waitFor("document.body.innerText.includes('Community warnings')"); await clickText("Sync "); await pause(1100);
const syncedOnce = await evaluate(`new Promise((resolve,reject)=>{const r=indexedDB.open('my-sherpa-offline');r.onsuccess=()=>{const q=r.result.transaction('reports').objectStore('reports').getAll();q.onsuccess=()=>{const rows=q.result.filter(x=>x.title===${JSON.stringify(testTitle)});resolve(rows.length===1&&rows[0].syncStatus==='synced')};q.onerror=()=>reject(q.error)}})`, true);
await clickText("Coordinator"); await waitFor("document.body.innerText.includes('Coordinator Demo')");
const verified = await evaluate(`(() => { const card=[...document.querySelectorAll('.review-card')].find(x=>x.textContent.includes(${JSON.stringify(testTitle)})); const button=[...(card?.querySelectorAll('button')??[])].find(x=>x.textContent.includes('Verify')); button?.click(); return Boolean(button); })()`); await pause(700);
await evaluate(`(() => { const card=[...document.querySelectorAll('.review-card')].find(x=>x.textContent.includes(${JSON.stringify(testTitle)})); const button=[...(card?.querySelectorAll('button')??[])].find(x=>x.textContent.includes('Inspect')); button?.click(); })()`); await pause(1000);
const appearsOnMap = await evaluate(`Boolean(document.querySelector('.trail-warning-marker')) && document.body.innerText.includes(${JSON.stringify(testTitle)})`);
console.log(JSON.stringify({ downloaded, savedBeforeRefresh, survivesRefresh, syncedOnce, verified, appearsOnMap }, null, 2));
socket.close();
