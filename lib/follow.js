import follow from 'follow';

export default function (opts) {
  const backlog = [];
  const changes = follow(opts);
  changes.on('change', (data) => {
    backlog.push(data);
  });

  changes.start();

  return function () {
    return new Promise((resolve, reject) => {
      if (backlog.length > 0) {
        resolve(backlog.shift(1));
      } else {
        changes.once('change', () => {
          resolve(backlog.shift(1));
        });
      }
    });
  };
}
