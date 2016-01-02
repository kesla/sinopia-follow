'use strict';

import YAML from 'js-yaml';
import fs from 'fs';
import path from 'path';
import follow from 'follow';
import request from 'request';
import setupDb from './lib/db';

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

    request({ url: registry + '/' + id, json: true }, (err, res) => {
      if (err) {
        return reject(err);
      }

      console.log(id, 'updated');
      fs.writeFileSync(
        path.join(storage, id, 'package.json'),
        JSON.stringify(res.body, null, '\t')
      );
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
