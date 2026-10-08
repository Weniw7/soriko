// Read-only public release gate: exact commit, public pages, private login shell and real CSS assets.
const origin = 'https://soriko.alfonso-millan.workers.dev';
const expected = process.env.GITHUB_SHA;
if (!expected || !/^[0-9a-f]{40}$/.test(expected)) throw new Error('Expected commit required');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fetchFresh(path) {
  return fetch(origin + path, { cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(15000) });
}

let current = false;
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const response = await fetchFresh('/_build.json?verify=' + expected);
    if (response.ok) {
      const marker = await response.json();
      current = marker.commit === expected;
      console.log('Build marker', attempt, response.status, current ? 'MATCH' : 'PROPAGATING');
    } else console.log('Build marker', attempt, response.status);
  } catch (error) {
    console.log('Build marker', attempt, error.name);
  }
  if (current) break;
  if (attempt < 12) await sleep(5000);
}
if (!current) throw new Error('Deployed commit was not observed at canonical Soriko hostname');

const publicRoutes = [
  ['/', ['SORIKO', 'POKÉMON TCG']],
  ['/shop/', ['SORIKO STORE PREVIEW', 'Pokémon']],
  ['/club/', ['SORIKO', 'CLUB']],
  ['/journal/', ['SORIKO JOURNAL']],
  ['/lab/', ['SORIKO LAB']]
];
const privateRoutes = ['/admin/','/admin/products/','/admin/inventory/','/admin/orders/','/admin/sourcing/'];

async function verifyRoute(path, required) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetchFresh(path + '?verify=' + expected);
    const html = await response.text();
    const valid = response.ok && required.every(marker => html.includes(marker));
    console.log(path, response.status, valid ? 'VERIFIED' : 'NOT VERIFIED');
    if (valid) return html;
    if (attempt < 4) await sleep(3000);
  }
  throw new Error('Route verification failed: ' + path);
}

let homepage = '';
for (const [path, markers] of publicRoutes) {
  const html = await verifyRoute(path, markers);
  if (path === '/') homepage = html;
}
for (const path of privateRoutes) {
  await verifyRoute(path, ['Soriko Commerce | Equipo', 'noindex']);
}

const cssMatch = homepage.match(/href="([^"]+\.css(?:\?[^"]*)?)"/);
if (!cssMatch) throw new Error('Public homepage has no CSS asset link');
const cssUrl = new URL(cssMatch[1], origin);
if (cssUrl.origin !== origin) throw new Error('Unexpected CSS asset origin');
const cssResponse = await fetch(cssUrl, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
const css = await cssResponse.text();
if (!cssResponse.ok || css.length < 1000) throw new Error('Homepage stylesheet is missing or unexpectedly empty');
console.log('CSS asset', cssResponse.status, css.length, 'bytes');
console.log('All Soriko Commerce public and private routes verified for commit', expected);
