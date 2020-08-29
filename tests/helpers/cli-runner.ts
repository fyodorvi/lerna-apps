// eslint-disable-next-line @typescript-eslint/no-var-requires
const execa = require('execa');

const LERNA_BIN = require.resolve('../../build/src/cli.js');

export function cliRunner(cwd: string, env?: Record<string, unknown>): (...args: string[]) => any {
    const opts = {
        cwd,
        env: Object.assign(
            {
                CI: 'true',
                // always turn off chalk
                FORCE_COLOR: '0',
            },
            env
        ),
        // when debugging integration test snapshots, uncomment next line
        // stdio: ["ignore", "inherit", "inherit"],
    };

    return (...args) => execa('node', [LERNA_BIN].concat(args), opts);
}
