This is changelog of node-jdk-utils project.

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
