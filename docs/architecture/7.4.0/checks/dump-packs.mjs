import { ClassicLevel } from 'classic-level';
import fs from 'node:fs'; import path from 'node:path';
// Usage: node dump-packs.mjs <repo>/packs <outdir>  (needs: npm i classic-level@1 in a scratch dir)
// Copies each LevelDB pack to a temp dir before opening, so the repository stays untouched.
const src = process.argv[2], out = process.argv[3];
fs.mkdirSync(out,{recursive:true});
for (const p of fs.readdirSync(src)) {
  const tmp = `${process.env.TMPDIR ?? "/tmp"}/wod20-packcopy/${p}`; fs.rmSync(tmp,{recursive:true,force:true}); fs.cpSync(path.join(src,p), tmp, {recursive:true});
  const db = new ClassicLevel(tmp, {valueEncoding:'json'});
  const rows = [];
  for await (const [k,v] of db.iterator()) rows.push({key:k, ...v});
  await db.close();
  fs.writeFileSync(path.join(out,p+'.json'), JSON.stringify(rows,null,1));
  console.log(p, rows.length);
}
