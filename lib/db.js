import jsondown from 'jsondown';
import pify from 'pify';

export default function (location) {
  const db = jsondown(location);

  return {
    open: pify(db.open.bind(db)),
    get: (key) => new Promise(function (resolve, reject) {
      db.get(key, (err, seq) => {
        if (err && !/NotFound/.test(err.message)) {
          reject(err);
        } else {
          resolve(seq);
        }
      });
    }),
    put: pify(db.put.bind(db))
  };
}
