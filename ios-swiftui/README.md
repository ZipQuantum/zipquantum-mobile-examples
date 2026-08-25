# SwiftUI example

Native iOS 16+ reference for Universal Links and explicit deferred recovery.

## Configure

1. Replace `com.example.ZipQuantumExample`, `TEAM_ID`, and `links.example.com` in `project.yml` and `Sources/Configuration.swift`.
2. In ZipQuantum, verify the same Team ID, Bundle ID, and hostname.
3. Install [XcodeGen](https://github.com/yonaskolb/XcodeGen), then run:

```sh
xcodegen generate
xcodebuild -project ZipQuantumExample.xcodeproj -scheme ZipQuantumExample -destination 'platform=iOS Simulator,name=iPhone 16' test
```

CI performs a generic simulator build because GitHub's macOS image may not include a bootable simulator runtime. Run the unit tests locally on any installed iOS simulator.

Universal Links should be tested on a physical device for production confidence. Deferred recovery is initiated only by the visible native paste control.

## Agent check

```sh
../scripts/validate.sh ios
```

No secret or live token belongs in source control.
