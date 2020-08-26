declare module '@lerna/add' {
    import { Command } from '@lerna/command';

    export class AddCommand extends Command {
        options: { bootstrap: boolean };
        project: { rootPath: string };
    }
}
