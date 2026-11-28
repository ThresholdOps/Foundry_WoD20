#!/usr/bin/env python3
"""CHK-SPLAT-REF: integrity of Splat -> component UUID references in system packs.
Input: directory of JSON dumps produced by dump-packs.mjs. Output: JSON summary on stdout.
Static data check of the repository packs; NOT a Foundry runtime check."""
import json, glob, os, sys, collections
d = sys.argv[1]
src = {}
for f in glob.glob(os.path.join(d, '*.json')):
    p = os.path.basename(f)[:-5]
    for r in json.load(open(f)):
        if r['key'].startswith('!items!'):
            src[(p, r['_id'])] = r
splats = [r for r in json.load(open(os.path.join(d, 'splats.json'))) if r['key'].startswith('!items!')]
ok = 0; missing = []; renamed = set(); outside_config = collections.Counter()
CONFIG_SPLAT = {"vampire","werewolf","mage","changeling","hunter","demon","wraith","mummy","exalted","mortal","creature","changingbreed","spirit"}
for r in splats:
    sid = r['system']['settings'].get('id')
    if sid not in CONFIG_SPLAT: outside_config[sid] += 1
    for k in ('abilities', 'advantages', 'features', 'powers'):
        for a in r['system'].get(k, []):
            p = a.get('uuid', '').split('.')
            key = (p[2], p[4]) if len(p) >= 5 else None
            if key not in src: missing.append([r['name'], k, a.get('name'), a.get('uuid')]); continue
            ok += 1
            if src[key]['name'] != a.get('name'): renamed.add((a.get('name'), src[key]['name']))
print(json.dumps({"check": "CHK-SPLAT-REF", "splats": len(splats), "references_ok": ok, "references_missing": missing,
                  "embedded_name_differs_from_source": sorted(renamed), "settings_id_outside_CONFIG_splat": outside_config}, indent=1))
