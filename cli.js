#!/usr/bin/env node

process.title = 'sinopia-follow';

require('babel-core/register')();
var start = require('./').default;
var args = require('./lib/args').default();

if (args.configPath) {
  start(args)
    .catch(function (err) {
      console.log(err.stack);
    });
}
