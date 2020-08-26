import { AddCommand } from '@lerna/add';
import bootstrap from '../bootstrap/bootstrap';

export class ExtendedAddCommand extends AddCommand {

    //execute is not called unless initialize detects there are some dependencies to add
    public async execute(): Promise<void> {
        // remembering original bootstrap chaining setting
        const originalBootstrap = this.options.bootstrap;
        this.options.bootstrap = false;
        await super.execute();

        // original bootstrap is actually undefined when it's true
        if (originalBootstrap !== false) {
            // copy from the original: commands/add/index.js
            const argv = Object.assign({}, this.options, {
                args: [],
                cwd: this.project.rootPath,
                // silence initial cli version logging, etc
                composed: 'add',
                // NEVER pass filter-options, it is very bad
                scope: undefined,
                ignore: undefined,
                private: undefined,
                since: undefined,
                excludeDependents: undefined,
                includeDependents: undefined,
                includeDependencies: undefined,
            });

            // calling extended bootstrap here
            await bootstrap(argv);
        }
    }
}

export default function factory(argv: unknown): ExtendedAddCommand {
    // TODO: type this
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new ExtendedAddCommand(argv);
}
