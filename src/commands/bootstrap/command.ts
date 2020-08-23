// eslint-disable-next-line @typescript-eslint/no-var-requires
const originalCommand = require('@lerna/bootstrap/command');
import factory from './bootstrap';

export const command = originalCommand.command;
export const describe = originalCommand.describe;
export const builder = originalCommand.builder;

export const handler = function handler(argv: any) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return factory(argv);
};
