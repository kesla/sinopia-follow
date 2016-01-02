import sinopiaFollow from './index';
import getArgs from './args';

const { configPath } = getArgs();

(async function start () {
  try {
    const args = await getArgs();
    if (args.configPath) {
      await sinopiaFollow(args);
    }
  } catch (err) {
    console.log(err.stack);
  }
})();
