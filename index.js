'use strict';

import YAML from 'js-yaml';
import fs from 'then-fs';
import path from 'path';
import follow from './lib/follow';
import setupDb from './lib/db';
import syncWithRegistry from './lib/sync-with-registry';

const skimdb = 'https://skimdb.npmjs.com/registry';
const registry = 'https://registry.npmjs.org';

(async function () {
  // make this configurable
  const config = YAML.safeLoad(await fs.readFile(
    path.join(process.env.HOME, '.config/sinopia/config.yaml')
  ));
  const { storage } = config;
  const db = setupDb(path.join(storage, '.sinopia-follow.json'));

  try {
    await db.open();
    const since = await db.get('npmjs') || 'now';
    const getChange = follow({ db: skimdb, since: since.toString() });

    while (true) {
      let { id, seq } = await getChange();

      if (await fs.exists(path.join(storage, id))) {
        await syncWithRegistry({ id, config, registry });
      }
      await db.put('npmjs', String(seq));
      console.log('Sync', seq, id);
    }
  } catch (err) {
    if (err) {
      console.log(err);
      console.log(err.stack);
    }
  }
})();
