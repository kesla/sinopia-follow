'use strict';

import YAML from 'js-yaml';
import fs from 'fs';
import path from 'path';
import follow from './lib/follow';
import setupDb from './lib/db';
import fetch from 'node-fetch';
import { Readable } from 'stream';

// make this configurable
const config = YAML.safeLoad(fs.readFileSync(
  path.join(process.env.HOME, '.config/sinopia/config.yaml')
));
const storage = config.storage;
const db = setupDb(path.join(storage, '.sinopia-follow.json'));

const skimdb = 'https://skimdb.npmjs.com/registry';
const registry = 'https://registry.npmjs.org';
let promise = Promise.resolve();

(async function () {
  try {
    await db.open();
    const since = await db.get('npmjs') || 'now';
    const getChange = follow({ db: skimdb, since: since.toString() });

    while (true) {
      let { id, seq } = await getChange();
      if (exists(id)) {
        await syncWithRegistry(id);
      }
      await db.put('npmjs', String(seq));
      console.log('Sync', seq, id);
    }
  } catch (err) {
    if (err) {
      console.log(err);
      console.log(err.stack)
    }
  }
})();

async function syncWithRegistry (id) {
  const res = await fetch(registry + '/' + id);
  const json = await res.json();
  fs.writeFileSync(
    path.join(storage, id, 'package.json'),
    JSON.stringify(json, null, '\t')
  );
  console.log(id, 'updated');
}

function exists (name) {
  try {
    fs.statSync(path.join(storage, name));
    return true;
  } catch (e) {}
  return false;
}
