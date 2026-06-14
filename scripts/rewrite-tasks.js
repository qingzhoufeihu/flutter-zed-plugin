const fs = require("fs");

const path = "languages/dart/tasks.json";
const tasks = JSON.parse(fs.readFileSync(path, "utf8"));

const filter =
  "filter='index($0, \"D/FlutterJNI(\") == 1 { next } index($0, \"I/flutter \") == 1 && index($0, \"Using the Impeller rendering backend\") { next } (index($0, \"D/FlutterGeolocator(\") == 1 || index($0, \"D/FlutterRenderer(\") == 1) { next } index($0, \"D/WindowLayoutComponentImpl(\") == 1 { next } index($0, \"V/Configuration(\") == 1 { next } substr($0, 1, 2) == \"I/\" && index($0, \": AssetManager2\") { next } index($0, \"D/InsetsController(\") == 1 { next } index($0, \"I/ImeTracker(\") == 1 { next } index($0, \"D/ProfileInstaller(\") == 1 { next } { print; fflush() }'; " +
  'run_flutter() { "$@" 2>&1 | awk "$filter"; return ${pipestatus[1]}; }; ';

const helpers =
  filter +
  'android_app_id() { for f in android/app/build.gradle android/app/build.gradle.kts; do [ -f "$f" ] || continue; app_id="$(sed -nE \'s/^[[:space:]]*applicationId[[:space:]]*(=)?[[:space:]]*"([^"]+)".*/\\2/p\' "$f" | head -n 1)"; [ -n "$app_id" ] && { echo "$app_id"; return; }; done; [ -f android/app/src/main/AndroidManifest.xml ] && sed -nE \'s/.*package="([^"]+)".*/\\1/p\' android/app/src/main/AndroidManifest.xml | head -n 1; }; ' +
  'uninstall_android_app() { app_id="$(android_app_id)"; if [ -n "$app_id" ] && command -v adb >/dev/null 2>&1; then adb -s "$1" uninstall "$app_id" >/dev/null 2>&1 || true; fi; }; ';

const projectRoot =
  'd="${ZED_DIRNAME:-$ZED_WORKTREE_ROOT}"; while [ -n "$d" ] && [ "$d" != "/" ] && [ ! -f "$d/pubspec.yaml" ]; do d="${d%/*}"; done; if [ ! -f "$d/pubspec.yaml" ]; then echo "No pubspec.yaml found above ${ZED_DIRNAME:-$ZED_WORKTREE_ROOT}"; exit 1; fi; cd "$d" || exit 1; ';

const flutterDevice =
  'device="$(flutter devices | awk -F \'•\' \'NF >= 3 && $3 ~ /android/ && device == "" { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); device=$2 } END { print device }\')"; ';

const fvmDevice =
  'device="$(fvm flutter devices | awk -F \'•\' \'NF >= 3 && $3 ~ /android/ && device == "" { gsub(/^[[:space:]]+|[[:space:]]+$/, "", $2); device=$2 } END { print device }\')"; ';

const flutterEmulator =
  'id="$(flutter emulators | awk \'/^[[:space:]]*[^[:space:]].*android[[:space:]]*$/ && id == "" { id=$1 } END { print id }\')"; ';

const fvmEmulator =
  'id="$(fvm flutter emulators | awk \'/^[[:space:]]*[^[:space:]].*android[[:space:]]*$/ && id == "" { id=$1 } END { print id }\')"; ';

function flutterAndroidCommand({ fvm = false, fallbackRunsPlain = true } = {}) {
  const tool = fvm ? "fvm flutter" : "flutter";
  const deviceProbe = fvm ? fvmDevice : flutterDevice;
  const emulatorProbe = fvm ? fvmEmulator : flutterEmulator;
  const launch = fvm ? 'fvm flutter emulators --launch "$id"; ' : 'flutter emulators --launch "$id"; ';
  const fallback = fallbackRunsPlain
    ? `run_flutter ${tool} run; exit $?; `
    : "exit 1; ";

  return (
    helpers +
    projectRoot +
    deviceProbe +
    `if [ -n "$device" ]; then uninstall_android_app "$device"; run_flutter ${tool} run -d "$device"; exit $?; fi; ` +
    emulatorProbe +
    `if [ -z "$id" ]; then echo "No Android device is running and no Android emulator was found."; ${fallback}fi; ` +
    'echo "No Android device is running. Launching Android emulator: $id"; ' +
    launch +
    'echo "Waiting for Android device to appear..."; ' +
    `for i in 1 2 3 4 5 6 7 8 9 10 11 12; do ${deviceProbe}if [ -n "$device" ]; then uninstall_android_app "$device"; run_flutter ${tool} run -d "$device"; exit $?; fi; sleep 5; done; ` +
    'echo "Android emulator did not appear within 60 seconds."; exit 1'
  );
}

for (const task of tasks) {
  if (task.label === "Flutter: Run on Android Emulator" || task.label === "Flutter: Restart App") {
    task.command = flutterAndroidCommand({ fvm: false, fallbackRunsPlain: true });
  }
  if (task.label === "FVM Flutter: Run" || task.label === "FVM Flutter: Restart App") {
    task.command = flutterAndroidCommand({ fvm: true, fallbackRunsPlain: true });
  }
}

fs.writeFileSync(path, JSON.stringify(tasks, null, 2) + "\n");
