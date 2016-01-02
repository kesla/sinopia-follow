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
let p;

db.open()
  .then(() => { return db.get('npmjs'); })
  .then((since = 'now') => {
    return new Promise((resolve, reject) => {
      follow({ db: skimdb, since: since.toString() }, (err, data) => {
        if (err) {
          return reject(err);
        }
        p = Promise.resolve(p)
          .then(() => { return data; })
          .then(handleData);
      });
    });
  })
  .catch((err) => { throw err; });

function handleData ({ id, seq }) {
  console.log('Sync', seq, id);
  return new Promise((resolve, reject) => {
    if (!exists(id)) {
      return resolve();
    }

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
        resolve();
      });
  })
  .then(() => {
    return db.put('npmjs', String(seq));
  })
  .catch(function (err) {
    throw err;
  });
}

function exists (name) {
  try {
    fs.statSync(path.join(storage, name));
    return true;
  } catch (e) {}
  return false;
}
