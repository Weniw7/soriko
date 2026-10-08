import { writeFileSync, existsSync } from 'node:fs';
if (!existsSync('out/index.html')) throw new Error('Build output missing');
const commit = process.env.GITHUB_SHA;
if (!commit || !/^[0-9a-f]{40}$/.test(commit)) throw new Error('A valid build commit is required');
writeFileSync('out/_build.json', JSON.stringify({commit, builtAt:new Date().toISOString(), component:'soriko-commerce-v1'})+'\n');
