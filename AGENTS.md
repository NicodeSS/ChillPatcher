# ChillPatcher 1.x maintenance

- This repository maintains the pre-OmniMix, in-game ChillPatcher architecture on the `1.x` branch. Build and test against the locally installed game.
- `origin` must point to `NicodeSS/ChillPatcher`, the self-maintained repository. Do not push commits, create pull requests, or submit patches to `BeyondtheApex/ChillPatcher`.
- Do not merge the upstream `main` branch into `1.x`. Upstream commit `76232ce` begins the independent audio-service and GUI architecture. Review any individual upstream fix for compatibility before porting it to `1.x`.
- Keep the game installation separate from build output. Run `build_release.bat` with `CHILL_STEAM_LIBRARY` set to the local Steam library, and deploy only when the task calls for deployment.
