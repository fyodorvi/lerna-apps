import {cliRunner} from './helpers/cli-runner';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const initFixture = require('@lerna-test/init-fixture')(__dirname);

test('lerna-apps bootstrap', async () => {
    const cwd = await initFixture('lerna-bootstrap');
    const lernaApps = cliRunner(cwd);
    const { stderr } = await lernaApps('bootstrap', '--npm-client', 'yarn');
    console.log(stderr);
});
