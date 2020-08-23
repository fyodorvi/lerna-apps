// eslint-disable-next-line @typescript-eslint/no-var-requires
const OriginalBootstrap = require('@lerna/bootstrap');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ChildProcessUtilities = require('@lerna/child-process');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const getExecOpts = require('@lerna/get-npm-exec-opts');
import fs from 'fs';
import path from 'path';

export class BootstrapCommand extends OriginalBootstrap.BootstrapCommand {
    public async execute(): Promise<void> {
        await super.execute();
        this.logger.info('', 'Performing post linking');

        // filtering out packages that no-one depends on, no point in packaging those
        const depsToPackage: any[] = this.filteredPackages.filter((pkg: any) => this.targetGraph.get(pkg.name).localDependents.size > 0);

        const tracker = this.logger.newItem('package');

        // create tar files for every package
        for (const pkg of depsToPackage) {
            // TODO: add NPM support, will require some fiddling with tarball filename
            // need to randomly generate tarball name for those dependencies
            pkg.tarName = `${pkg.name}${(new Date).getTime()}.tgz`;
            pkg.tarLocation = path.join(pkg.location, pkg.tarName);
            const opts = getExecOpts(pkg, this.npmConfig.registry);
            await ChildProcessUtilities.exec('yarn', ['pack', '--filename', pkg.tarName], opts);
            tracker.completeWork(1);
            this.logger.silly('pack', pkg.name, 'Finished packing');
        }
        tracker.finish();

        const tarToCleanUp: string[] = [];
        // copy tar files to dependants location
        for (const pkg of depsToPackage) {
            const localDependents = this.targetGraph.get(pkg.name).localDependents.keys();

            for (const dependantName of localDependents) {
                const dependantPackage = this.filteredPackages.find((searchPkg: any) => searchPkg.name === dependantName);
                fs.copyFileSync(pkg.tarLocation, path.join(dependantPackage.location, pkg.tarName));
                tarToCleanUp.push(path.join(dependantPackage.location, pkg.tarName));
            }
            fs.unlinkSync(pkg.tarLocation);
        }

        const packagesToRelink: any[] = this.filteredPackages.filter((pkg: any) => this.targetGraph.get(pkg.name).localDependencies.size > 0);

        for (const pkg of packagesToRelink) {
            // getting dependency name for the package
            const dependencyNames: string[] = Array.from(this.targetGraph.get(pkg.name).localDependencies.keys());
            // remember the lock file
            // TODO: support npm lock files here
            const lockFileCache = fs.readFileSync(path.join(pkg.location, 'yarn.lock'), 'utf-8');

            // remember package.json of every dependant package
            const packageJsonCache = fs.readFileSync(pkg.manifestLocation, 'utf-8');

            // string original dependencies here from package.json, otherwise install will fail
            const parsedPackageJson = JSON.parse(packageJsonCache);
            for (const dependencyName of dependencyNames) {
                delete parsedPackageJson.dependencies[dependencyName];
            }

            fs.writeFileSync(pkg.manifestLocation, JSON.stringify(parsedPackageJson, undefined, '\t'));

            try {
                const tarFiles = [];
                for (const dependencyName of dependencyNames) {
                    const dependencyPkg = this.filteredPackages.find((searchPkg: any) => searchPkg.name === dependencyName);
                    tarFiles.push(`file:./${dependencyPkg.tarName}`);
                }

                const opts = getExecOpts(pkg, this.npmConfig.registry);

                // trying to remove dependencies first to flush the folders
                for (const dependencyName of dependencyNames) {
                    try {
                        // removing the symlink
                        fs.unlinkSync(path.join(pkg.location, 'node_modules', dependencyName));
                        await ChildProcessUtilities.exec('yarn', ['remove', dependencyName], opts);
                    } catch (e) {
                        // could be an error that some of them is not installed, just swallowing at this point
                    }
                }

                await ChildProcessUtilities.spawnStreaming('yarn', ['add', ...tarFiles], opts);
            } catch (e) {

            } finally {
                // restore package.json in any case
                fs.writeFileSync(pkg.manifestLocation, packageJsonCache);
                // restore the lock file in any case
                fs.writeFileSync(path.join(pkg.location, 'yarn.lock'), lockFileCache);
            }
        }

        for (const tar of tarToCleanUp) {
            fs.unlinkSync(tar);
        }
    }
}

export default function factory(argv: unknown): BootstrapCommand {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new BootstrapCommand(argv);
}
