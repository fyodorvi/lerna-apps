declare module '@lerna/bootstrap' {
    import { Command } from '@lerna/command';
    import {Package} from '@lerna/package';
    import {PackageGraph} from '@lerna/package-graph';

    export class BootstrapCommand extends Command {
        protected filteredPackages: Package[];
        protected npmConfig: {
            registry: string;
        };
        protected targetGraph: PackageGraph;
        async execute(): Promise<void>;
    }
}
