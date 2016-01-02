import YAML from 'js-yaml';
import fs from 'then-fs';
import path from 'path';
import follow from './follow';
import setupDb from './db';
import syncWithRegistry from './sync-with-registry';
import assert from 'assert';

const skimdb = 'https://skimdb.npmjs.com/registry';
const registry = 'https://registry.npmjs.org';

export default async function ({ configPath }) {
  assert(configPath, 'required: configPath');

  const config = YAML.safeLoad(await fs.readFile(configPath));
  const { storage } = config;
  const db = setupDb(path.join(storage, '.sinopia-follow.json'));

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
};
