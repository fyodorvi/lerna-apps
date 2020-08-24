declare module '@lerna/child-process' {
    export function exec(command: string, args: string[], opts: Record);
}
