// Public read-only probes. Retry propagation, never turn a persistent error green.
const origin='https://sorico.alfonso-millan.workers.dev';
const expected=process.env.GITHUB_SHA;
if(!expected||!/^[0-9a-f]{40}$/.test(expected))throw new Error('Expected commit required');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fetchFresh(path){return fetch(origin+path,{cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(15000)});}
let current=false;
for(let attempt=1;attempt<=12;attempt++){
 try{
  const response=await fetchFresh('/_build.json?verify='+expected);
  if(response.ok){const marker=await response.json();current=marker.commit===expected;console.log('Build marker',attempt,response.status,current?'MATCH':'PROPAGATING');}
  else console.log('Build marker',attempt,response.status);
 }catch(error){console.log('Build marker',attempt,error.name);}
 if(current)break;
 if(attempt<12)await sleep(5000);
}
if(!current)throw new Error('Deployed commit was not observed at public hostname');
for(const path of ['/','/admin/','/admin/radar/','/admin/analyze/','/admin/products/','/admin/opportunities/','/admin/suppliers/','/admin/jobs/','/admin/alerts/']){
 let valid=false;
 for(let attempt=1;attempt<=4;attempt++){
  const response=await fetchFresh(path+'?verify='+expected),html=await response.text();
  valid=response.ok&&(path==='/'?html.includes('Soriko Club'):html.includes('Soriko Engine | Equipo')&&html.includes('noindex'));
  console.log(path,response.status,valid?'VERIFIED':'NOT VERIFIED');
  if(valid)break;
  if(attempt<4)await sleep(3000);
 }
 if(!valid)throw new Error('Route verification failed: '+path);
}
console.log('All public routes verified for commit',expected);
