'use strict';

import YAML from 'js-yaml';
import fs from 'fs';
import path from 'path';
import follow from 'follow';
import jsondown from 'jsondown';
import Lock from 'lock';
import request from 'request';

// make this configurable
const config = YAML.safeLoad(fs.readFileSync(
  path.join(process.env.HOME, '.config/sinopia/config.yaml')
));
const storage = config.storage;
const db = jsondown(path.join(storage, '.sinopia-follow.json'));
const lock = new Lock();

const skimdb = 'https://skimdb.npmjs.com/registry';
const registry = 'https://registry.npmjs.org';

db.open(function (err) {
  if (err) {
    throw err;
  }

  db.get('npmjs', function (err, seq) {
    if (err && !/Not Found/.test(err)) {
      throw err;
    }
    const since = (seq || 'now').toString();

    // follow
    follow({ db: skimdb, since: since }, function (err, data) {
      if (err) {
        throw err;
      }

      handleData(data);
    });
  });
});

function handleData (data) {
  const name = data.id;

  lock('update-sequence', function (release) {
    console.log('Updating', data.seq, data.id);
    const cb = release(function (err) {
      if (err) {
        throw err;
      }
    });

    if (!exists(data.id)) {
      db.put('npmjs', String(data.seq), cb);
      return;
    }

    request({ url: registry + '/' + name, json: true }, function (err, res) {
      if (err) {
        throw err;
      }

      console.log(name, 'updated');
      fs.writeFileSync(
        path.join(storage, name, 'package.json'),
        JSON.stringify(res.body, null, '\t')
      );
      db.put('npmjs', String(data.seq), cb);
    });
  });
}

function exists (name) {
  try {
    fs.statSync(path.join(storage, name));
    return true;
  } catch (e) {}
  return false;
}
