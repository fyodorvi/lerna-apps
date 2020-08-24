declare module '@lerna/get-npm-exec-opts' {
    import {Package} from '@lerna/package';

    export default function getExecOpts(pkg: Package, registry: string);

}
