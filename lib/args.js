import commander from 'commander';
import path from 'path';
import fs from 'then-fs';

export default async function () {
  const { version } = JSON.parse(await fs.readFile(__dirname + '/../package.json'));

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
