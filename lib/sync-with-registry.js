import fetch from 'node-fetch';
import fs from 'then-fs';
import path from 'path';

export default async function syncWithRegistry ({ id, config, registry }) {
  const res = await fetch(registry + '/' + id);
  const json = await res.json();
  await fs.writeFile(
    path.join(config.storage, id, 'package.json'),
    JSON.stringify(json, null, '\t')
  );
  console.log(id, 'updated');
};
