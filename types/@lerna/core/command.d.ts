declare module '@lerna/command' {
    import npmlog = require('npmlog');

    export class Command {
        protected logger: npmlog.Logger;

        async execute(): Promise<void>;
    }
}
