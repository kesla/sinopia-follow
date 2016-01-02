'use strict';

import YAML from 'js-yaml';
import fs from 'fs';
import path from 'path';
import follow from 'follow';
import setupDb from './lib/db';
import fetch from 'node-fetch';

// make this configurable
const config = YAML.safeLoad(fs.readFileSync(
  path.join(process.env.HOME, '.config/sinopia/config.yaml')
));
const storage = config.storage;
const db = setupDb(path.join(storage, '.sinopia-follow.json'));

const skimdb = 'https://skimdb.npmjs.com/registry';
const registry = 'https://registry.npmjs.org';
let promise = Promise.resolve();

db.open()
  .then(() => { return db.get('npmjs'); })
  .then((since = 'now') => {
    return new Promise((resolve, reject) => {
      follow({ db: skimdb, since: since.toString() }, (err, { id, seq }) => {
        if (err) {
          return reject(err);
        }

        if (exists(id)) {
          promise = promise
            .then(() => { return { id }; })
            .then(syncWithRegistry);
        }

        promise = promise.then(() => {
          console.log('Sync', seq, id);

          return db.put('npmjs', String(seq));
        });
      });
    });
  })
  .catch((err) => { throw err; });

function syncWithRegistry ({ id }) {
  return fetch(registry + '/' + id)
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      fs.writeFileSync(
        path.join(storage, id, 'package.json'),
        JSON.stringify(json, null, '\t')
      );
      console.log(id, 'updated');
    });
}

function exists (name) {
  try {
    fs.statSync(path.join(storage, name));
    return true;
  } catch (e) {}
  return false;
}
