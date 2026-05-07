This is changelog of node-jdk-utils project.

## 0.7.0
- Added `additionalLocations` option for `findRuntimes` so consumers can supply extra parent folders to scan for Java Homes. [#19](https://github.com/Eskibear/node-jdk-utils/issues/19) ([#26](https://github.com/Eskibear/node-jdk-utils/pull/26))
- Detect SDKMAN installed via Homebrew (`brew install sdkman-cli`). [#22](https://github.com/Eskibear/node-jdk-utils/issues/22) ([#25](https://github.com/Eskibear/node-jdk-utils/pull/25))
- Fixed: SDKMAN candidates whose `bin/java` is a symlink into a nested `Contents/Home` (e.g. Zulu on macOS) now report the real Java Home, fixing Gradle daemon JAVA_HOME mismatches. [#17](https://github.com/Eskibear/node-jdk-utils/issues/17) ([#27](https://github.com/Eskibear/node-jdk-utils/pull/27))

## 0.6.1
- Added support for mise. [#21](https://github.com/Eskibear/node-jdk-utils/pull/21)
- Fixed Dependabot vulnerability alerts. [#23](https://github.com/Eskibear/node-jdk-utils/pull/23)
- Switched npm publish workflow to OIDC trusted publishing. [#24](https://github.com/Eskibear/node-jdk-utils/pull/24)

## 0.6.0
- Added support for jBang. [#18](https://github.com/Eskibear/node-jdk-utils/pull/18)

## 0.5.1
- Fixed: `/usr` detected as a wrong Java home on macOS. [#15](https://github.com/Eskibear/node-jdk-utils/issues/15)

## 0.5.0
- Scan default installation directory for Zulu on Windows.[#12](https://github.com/Eskibear/node-jdk-utils/pull/12)
- Traverse entires in env.PATH to cover all possible locations. Note, this increases disk I/O which will affect the performance depending on number of entries of env.PATH. [#13](https://github.com/Eskibear/node-jdk-utils/pull/13)
- Add `skipFrom` option which allow you to skip scanning from specific source to improve overall performance. [#14](https://github.com/Eskibear/node-jdk-utils/pull/14)

## 0.4.6
- Fix gradle toolchains Windows path structure. [#11](https://github.com/Eskibear/node-jdk-utils/pull/11)

## 0.4.5
- Support to detect JDKs installed by Gradle. [#9](https://github.com/Eskibear/node-jdk-utils/issues/9)]

## 0.4.4
- Better support for ASDF, searching `env.ASDF_DATA_DIR` instead of `env.ASDF_DIR`. [#8](https://github.com/Eskibear/node-jdk-utils/pull/8)

## 0.4.3
- Support to detect JDKs installed by ASDF. [#7](https://github.com/Eskibear/node-jdk-utils/pull/7)

## 0.4.2
### Added
- Support to detect JDKs installed by Homebrew, covering macOS Apple Silicon and Linux.

## 0.4.1
### Added
- Add CLI to list all detected runtimes, which is convenient for testing coverage.

## 0.4.0
### Added
- Support to detect JDKs installed by Homebrew (macOS only).

### Fixed
- For candidates from envs like `PATH`, resolve symbolic links of `bin/java` to get real path of the installation.

## 0.3.1
### Changed
- Simplify APIs.

## 0.3.0
### Added
- Support to detect JDKs installed by jabba.
- New API **getSources(runtime)** to list sources where a Java Runtime is found.

## 0.2.1
### Fixed
- For macOS, add below sources to detect runtimes:
  - `~/Library/Java/JavaVirtualMachines`
  - Output of `java_home -V`

## 0.2.0
### Added
- New API **getRuntime(homedir, options)**: verify if given directory is a valid runtime, and provide more information if it is.
- Export type defitions for better usablity.

## 0.1.0
### Added
- New API **findRuntimes(options)**: list all Java runtimes installed on local machine. It searches locations deducted from environment variables (PATH/JAVA_HOME/JDK_HOME), SDKMAN installation directory, jEnv configurations, and default installation locations of popular distributions.
