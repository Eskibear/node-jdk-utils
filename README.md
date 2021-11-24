# node-java-utils

A collection of Java related utils.

## Installation
```bash
npm i java-utils
```

## Usage

### findJavaRuntime

Find Java runtime from all possible locations on your machine.
Covering:
* `JAVA_HOME`.
* JDK-like paths from `PATH`.
* SDKMAN installation location.
* Links specified in jEnv.
* Platform-specific conventional installation location:
  * Linux: `/usr/lib/jvm`
  * macOS: `/Library/Java/JavaVirtualMachines`
  * Windows: JDK-like folders under `%ProgramFiles%` and `%LocalAppData%`,


callback-style

```ts
require("java-utils").findRuntimes().then(console.log)
/*
[{
    homedir: '/home/username/.sdkman/candidates/java/17.0.1-ms',
    hasJava: true
  }, {
    homedir: '/usr/lib/jvm/java-11-openjdk-amd64',
    hasJava: true 
  },
...
]
*/
```

promise-style
```ts
import { findRuntimes } from "java-utils";
await findRuntimes({checkJavac: true, withVersion: true});
/*
[{
    homedir: '/home/yanzh/.sdkman/candidates/java/17.0.1-ms',
    hasJava: true,
    hasJavac: true,
    version: { openjdk_version: '17.0.1', major: 17 }
  }, {
    homedir: '/usr/lib/jvm/java-11-openjdk-amd64',
    hasJava: true,
    hasJavac: true,
    version: { openjdk_version: '11.0.7', major: 11 }
  },
...
]
*/
```

