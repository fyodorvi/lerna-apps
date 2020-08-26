import {Package} from '@lerna/package';
import * as ChildProcessUtilities from '@lerna/child-process';
import getExecOpts from '@lerna/get-npm-exec-opts';
import fs from 'fs';
import path from 'path';
import { BootstrapCommand } from '@lerna/bootstrap';

export class ExtendedBootstrapCommand extends BootstrapCommand {
    public async execute(): Promise<void> {
        await super.execute();
        this.logger.info('lerna-apps', 'Performing packing, post-linking and installing');

        // filtering out packages that no-one depends on, no point in packaging those
        const depsToPackage: Package[] = this.filteredPackages.filter((pkg: Package) => this.targetGraph.get(pkg.name).localDependents.size > 0);

        let tracker = this.logger.newItem('package');
        tracker.addWork(depsToPackage.length);
        const tarToCleanUp: string[] = [];

        // create tar files for every package
        for (const pkg of depsToPackage) {
            // TODO: add NPM support, will require some fiddling with tarball filename
            // TODO: later reuse this method for pre-deployment step
            // need to randomly generate tarball name for those dependencies
            pkg.tarName = `${pkg.name}${(new Date).getTime()}.tgz`;
            pkg.tarLocation = path.join(pkg.location, pkg.tarName);
            const opts = getExecOpts(pkg, this.npmConfig.registry);
            await ChildProcessUtilities.exec('yarn', ['pack', '--filename', pkg.tarName], opts);
            this.logger.silly('pack', pkg.name, 'Finished packing');
            const localDependents = this.targetGraph.get(pkg.name).localDependents.keys();

            for (const dependantName of localDependents) {
                const dependantPackage = this.filteredPackages.find((searchPkg: Package) => searchPkg.name === dependantName);
                if (dependantPackage) {
                    fs.copyFileSync(pkg.tarLocation, path.join(dependantPackage.location, pkg.tarName));
                    tarToCleanUp.push(path.join(dependantPackage.location, pkg.tarName));
                }
            }
            fs.unlinkSync(pkg.tarLocation);
            tracker.completeWork(1);
        }

        tracker.finish();

        const packagesToRelink: any[] = this.filteredPackages.filter((pkg: any) => this.targetGraph.get(pkg.name).localDependencies.size > 0);

        tracker = this.logger.newItem('relink');
        tracker.addWork(packagesToRelink.length);

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
                    const dependencyPkg = this.filteredPackages.find((searchPkg: Package) => searchPkg.name === dependencyName);
                    if (dependencyPkg) {
                        tarFiles.push(`file:./${dependencyPkg.tarName}`);
                    }
                }

                const opts = getExecOpts(pkg, this.npmConfig.registry);

                // trying to remove dependencies first to flush the folders
                for (const dependencyName of dependencyNames) {
                    try {
                        // removing the symlink
                        this.logger.verbose('lerna-apps', `removing symlink ${dependencyName} from ${pkg.name}`);
                        fs.unlinkSync(path.join(pkg.location, 'node_modules', dependencyName));
                        await ChildProcessUtilities.exec('yarn', ['remove', dependencyName], opts);
                    } catch (e) {
                        // could be an error that some of them is not installed, just swallowing at this point
                    }
                }

                this.logger.verbose('lerna-apps', `adding ${tarFiles.join(', ')} to ${pkg.name}`);
                await ChildProcessUtilities.exec('yarn', ['add', ...tarFiles], opts);
            } catch (e) {
                this.logger.error('lerna-apps', 'Error occured during relinking', e);
                // need to log and rethrow here
            } finally {
                this.logger.verbose('lerna-apps', `restoring package manifest and lock file for ${pkg.name}`);
                // restore package.json in any case
                fs.writeFileSync(pkg.manifestLocation, packageJsonCache);
                // restore the lock file in any case
                fs.writeFileSync(path.join(pkg.location, 'yarn.lock'), lockFileCache);
                tracker.completeWork(1);
            }
        }

        for (const tar of tarToCleanUp) {
            fs.unlinkSync(tar);
        }

        tracker.finish();
        this.logger.info('lerna-apps', 'Relinked and reinstalled packages');
    }
}

export default function factory(argv: unknown): ExtendedBootstrapCommand {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new ExtendedBootstrapCommand(argv);
}
