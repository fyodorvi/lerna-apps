declare module '@lerna/package' {
    export class Package {
        public name: string;
        public location: string;

        // custom
        public tarName?: string;
        public tarLocation?: string;
    }
}
