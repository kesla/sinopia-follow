import commander from 'commander';
import path from 'path';
import { version } from '../package.json';

export default function () {
  commander
    .option('-c, --config <config.yaml>', 'use this configuration file (default: ./config.yaml)')
    .version(version)
    .parse(process.argv);

  if (commander.args.length !== 0) {
    commander.help();
  }

  return {
    configPath: commander.config ||
    path.join(process.env.HOME, '.config/sinopia/config.yaml')
  };
}
