// publishing script
import { config } from 'dotenv';
import { Exec } from 'suf-node';
import { callbackify } from 'util';
config();

(async () => {
  const OVSXToken = process.env.OVSX_TOKEN;
  if (OVSXToken === undefined) {
    Failed('Error: variable "OVSX_TOKEN" not defined in .env');
    process.exit(1);
  }
  await Try('yarn pre:distribute');
  await Try(`ovsx publish -p ${OVSXToken}`);
  await Try('vsce publish');
})();

function Failed(msg: string) {
  console.log(`\x1b[1;38;2;255;0;0m${msg}\x1b[m`);
}
function Finished(msg: string) {
  console.log(`\x1b[1;38;2;0;255;0m${msg}\x1b[m`);
}

async function Try(command: string) {
  try {
    await Exec(command);
    Finished(`Finished: ${command}`);
  } catch (e) {
    console.log(e);
    Failed(`Failed: ${command}`);
  }
}
