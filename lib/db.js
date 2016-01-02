import fs from 'then-fs';

export default async function (location) {
  let data = {};

  try {
    data = JSON.parse(await fs.readFile(location, 'utf8'));
  } catch (e) {}

  return {
    get: function (key) {
      return data['$' + key];
    },
    put: async function (key, value) {
      data['$' + key] = value;
      await fs.writeFile(location, JSON.stringify(data, null, 2));
    }
  };
}
