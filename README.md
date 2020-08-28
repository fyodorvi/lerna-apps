# Lerna Apps

[![circleci](https://circleci.com/gh/fyodorvi/lerna-apps.svg?style=shield)](https://circleci.com/gh/fyodorvi/lerna-apps)
![npm](https://img.shields.io/npm/v/lerna-apps)

## Usage

```bash
yarn add lerna-apps
```

## What is it?

[Lerna](https://lerna.js.org/) is a great tool for monorepo management, however it is mainly designed for node packages rather than applications. 
This module extends original Lerna and makes it convenient to manage application monorepos with it.

## What's wrong with lerna?

Lerna has tons of great features, however the whole design assumes you will publish packages to a repository,
this is not applicable when, for example, you need to build, version and package backend into a docker image,
which becomes hard if you also have a dependency on another package. The only proper solution to that would
actual publishing to a repository, which could be local (like verdacio).

Second issue - shared package dependencies during local development, this is not possible to solve by publishing package to a repository. Here's the scenario:

```
packages
   \ moduleA
      - depends on momentjs
   \ moduleB
      - depends on momentjs
      - depends on mobuleA
```
ModuleA code:
```typescript
    import moment from 'moment';
    export const moduleADate = moment();
``` 

ModuleB code:
```typescript
    import { moduleADate } from 'moduleA';
    import moment from 'moment';
    console.log(moduleADate instanceof moment) // outputs false!
```

You might say that is what Lerna hoisting or Yarn Workspaces solve, and indeed that's one of the solution, however
it doesn't work well in all scenarios, especially when you have large monorepos with applications that have a variety
of dependencies of different versions (when there's a clashing dependency one of them will be still local to the package).  

**Note: if you are using Lerna hoisting or Yarn Workspaces this module is not for you. You might look into using [nx](https://github.com/nrwl/nx) instead.**

Third issue: lock file. Since none of as packages assumed as "final destination", Lerna does not provide any lock file,
which is crucial when building application. Example

```
packages
   \ moduleA
      - depends on momentjs
      yarn.lock
   \ moduleB
      - depends on mobuleA
      yarn.lock
```

In the example above moduleB lock file should contain moment record, however it won't since Lerna does not actally install
the package, it only symlinks it. 

## The solution

Lerna-apps extends several original Lerna functions, refer to the details below.

### bootstrap

Bootstrap works the same way as the original once, with one extension at the end of the process: 
symlinks for local packages are deleted, local packages are `pack`ed and added to dependants, `package.json`
and lock files are preserved in their original state. This way dependencies from local packages are properly installed
by NPM/Yarn. In the end, local packages are removed from dependants lock files.

Since everything gets properly packaged instead of symlinking you need to re-run bootstrap each time you change a shared packaged.

### add

By default, add will run bootstrap command, this is modified to run modified lerna-apps command.  
