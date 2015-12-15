'use strict';

var YAML = require('js-yaml');
var fs = require('fs');
var path = require('path');
var follow = require('follow');
var jsondown = require('jsondown');
var Lock = require('lock');
var request = require('request');

// make this configurable
var config = YAML.safeLoad(fs.readFileSync(
  path.join(process.env.HOME, '.config/sinopia/config.yaml')
));
var storage = config.storage;
var db = jsondown(path.join(storage, '.sinopia-follow.json'));
var lock = new Lock();

var skimdb = 'https://skimdb.npmjs.com/registry';
var registry = 'https://registry.npmjs.org';

db.open(function (err) {
  if (err) {
    throw err;
  }

  db.get('npmjs', function (err, seq) {
    if (err && !/Not Found/.test(err)) {
      throw err;
    }
    var since = (seq || 'now').toString();

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
  var name = data.id;

  lock('update-sequence', function (release) {
    console.log('Updating', data.seq, data.id);
    var cb = release(function (err) {
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
