import sinopiaFollow from './index';
import getArgs from './args';

const { configPath } = getArgs();

if (configPath) {
  sinopiaFollow({ configPath })
    .catch(function (err) {
      console.log(err.stack);
    });
}
