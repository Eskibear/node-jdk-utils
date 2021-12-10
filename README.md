# node-jdk-utils

<span class="badge-npmversion"><a href="https://npmjs.org/package/jdk-utils" title="View this project on NPM"><img src="https://img.shields.io/npm/v/jdk-utils.svg" alt="NPM version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/jdk-utils" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/jdk-utils.svg" alt="NPM downloads" /></a></span>

A collection of Java related utils.

## Installation
```bash
npm i jdk-utils
```

## Usage

### findJavaRuntime

Find Java runtime from all possible locations on your machine.
Covering:
* `JAVA_HOME`.
* JDK-like paths from `PATH`.
* SDKMAN installation location.
* jabba installation location, i.e. `~/.jabba/jdk`
* Links specified in jEnv.
* Platform-specific conventional installation location:
  * Linux: `/usr/lib/jvm`
  * macOS: `/Library/Java/JavaVirtualMachines`, `~/Library/Java/JavaVirtualMachines`, output of `java_home -V`.
  * Windows: JDK-like folders under `%ProgramFiles%` and `%LocalAppData%`,


callback-style

```ts
require("jdk-utils").findRuntimes().then(console.log)
/*
[{
    homedir: '/home/username/.sdkman/candidates/java/17.0.1-ms',
  }, {
    homedir: '/usr/lib/jvm/java-11-openjdk-amd64',
  },
...
]
*/
```

promise-style
```ts
import { findRuntimes } from "jdk-utils";
await findRuntimes({checkJavac: true, withVersion: true, withTags: true});
/*
[{
    homedir: '/home/yanzh/.sdkman/candidates/java/17.0.1-ms',
    hasJavac: true,
    isFromSDKMAN: true,
    version: { java_version: '17.0.1', major: 17 }
  }, {
    homedir: '/usr/lib/jvm/java-11-openjdk-amd64',
    hasJavac: true,
    version: { java_version: '11.0.7', major: 11 }
  },
...
]
*/
```

