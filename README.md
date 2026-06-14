# Flutter Tools for Zed

Flutter Tools is a Zed extension that adds Flutter workflow tasks for Dart and
Flutter projects in Zed.

This lightweight dev-extension build does not include a Rust component, so it
can be installed without `rustc` or `cargo`.

## What It Provides

- Flutter run and build task templates available from Zed's task picker.

This extension includes Dart language files so Flutter task templates can attach
to Dart files without breaking syntax highlighting. It does not provide Dart
LSP, debugging, or pure Dart workflow tasks. Install Zed's official `Dart`
extension for full language support.

## Requirements

- Zed
- Dart SDK available on `PATH`
- Flutter SDK available on `PATH`
- Zed's official `Dart` extension for Dart language support
- Optional for iOS: Xcode and Simulator.app

## Install Locally

1. Open Zed.
2. Run `zed: extensions`.
3. Choose `Install Dev Extension`.
4. Select this repository directory.
5. Open a Dart or Flutter project.

After changing this extension during local development, reinstall the dev
extension or restart Zed before testing tasks again. Zed may keep previously
loaded task definitions in memory.

Also start a fresh task from `task: spawn` after reinstalling. Rerunning an
existing task terminal can reuse the old command string that was captured when
that task was first created. In Zed's task picker, `Enter` may reuse task
history for the highlighted label; use `cmd-enter` for "Rerun Without History"
when testing a changed task.

## Flutter Tasks

Open and focus a `.dart` file, run `task: spawn`, then choose one of these
tasks:

- `Flutter: Run on Android Emulator`
- `Flutter: Run on iOS Simulator`
- `Flutter: Run on Chrome`
- `Flutter: Run on macOS`
- `Flutter: Build APK`
- `Flutter: Build Modern APK`
- `Flutter: Build App Bundle`
- `Flutter: Build iOS (.ipa)`
- `Flutter: Build Web`

These tasks are attached to Dart files, so Zed only shows them while a Dart file
is the active editor. If your Flutter app is inside a subdirectory such as
`client/`, you can still open the parent folder in Zed. The Flutter tasks walk
up from the active Dart file and run in the nearest directory containing
`pubspec.yaml`.

Zed tasks are static commands, so this extension does not expose Flutter's full
interactive device picker. Choose a fixed target such as
`Flutter: Run on Android Emulator` or `Flutter: Run on macOS`.

`Flutter: Run on Android Emulator` handles the common Android emulator case
automatically: if no Android device is currently running, the task launches the
first Android emulator returned by `flutter emulators`, waits for it to appear,
then continues with `flutter run -d <device-id>`. Users do not need to remember
or type `flutter emulators --launch <id>`.

`Flutter: Build iOS (.ipa)` runs `flutter build ipa --release`, which produces
the IPA artifact used for TestFlight and App Store upload.

Release build tasks use explicit release commands:

- `Flutter: Build APK` runs `flutter build apk --release`
- `Flutter: Build Modern APK` runs `flutter build apk --release --split-per-abi`
- `Flutter: Build App Bundle` runs `flutter build appbundle --release`
- `Flutter: Build iOS (.ipa)` runs `flutter build ipa --release`

`Flutter: Build Modern APK` produces separate ABI-specific APKs, which are
smaller than a universal APK and are useful for direct distribution outside
Google Play.

This behavior applies when the run is started from Zed's task picker. Typing
`flutter run` directly in a normal terminal bypasses Zed tasks and uses the
Flutter CLI unchanged.

## Restart and Hot Reload

Run tasks set `allow_concurrent_runs` to `true`. That lets Zed's `task: rerun`
cancel the previous `flutter run` task and start a fresh one in the same
terminal.

For Flutter's built-in hot reload and hot restart while `flutter run` is active,
focus the task terminal and press:

- `r` for hot reload
- `R` for hot restart
- `q` to quit

Zed does not currently expose the same Flutter daemon command surface that the
VS Code Flutter extension uses, so this first version uses native Flutter CLI
tasks instead of a custom device picker or inspector panel.

## Debugging and LSP

This extension intentionally does not ship Rust debug adapter code, so it can be
installed locally without a Rust toolchain. Use Zed's official `Dart` extension
for Dart LSP and Dart/Flutter debugging.

Example `.zed/debug.json` for the official Dart extension:

```json
[
  {
    "adapter": "Dart",
    "label": "Flutter: Debug",
    "type": "flutter",
    "request": "launch",
    "program": "lib/main.dart",
    "device_id": "ios",
    "platform": "mobile"
  }
]
```

Change `device_id` to `chrome`, `macos`, or a device id from
`flutter devices`.

## Development

There is no Rust build step in this lightweight version. Most Flutter workflow
features live in `languages/dart/tasks.json`.
