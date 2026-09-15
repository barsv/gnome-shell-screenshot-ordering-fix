# GNOME 46 screenshot portal ordering fix

On Ubuntu 24.04's GNOME Shell 46, disabling desktop animations can break
portal screenshots. Gradia then shows `Screenshot cancelled` even after a
successful selection.

The cause is a race in GNOME Shell: it starts saving the screenshot and closes
the screenshot UI immediately. The portal receives `closed` before it receives
`screenshot-taken`, so it reports a cancellation. This extension defers only
the final close until the save operation completes. It is a local adaptation of
the upstream GNOME Shell fix for this ordering bug.

## Install

The packaged extension is in `dist/`:

```bash
gnome-extensions install \
  dist/gradia-screenshot-race-fix@stan.shell-extension.zip
gnome-extensions enable gradia-screenshot-race-fix@stan
```

Then animations may remain disabled:

```bash
gsettings set org.gnome.desktop.interface enable-animations false
```

## Test

```bash
gjs -m test-ordering.js
gradia --screenshot=INTERACTIVE
```

`test-ordering.js` checks the success path, an unsuccessful save, ordinary
cancellation, and restoration after disabling the extension.

## Rebuild the ZIP after changes

Run this from the project directory:

```bash
python3 - <<'PY'
import zipfile
from pathlib import Path

files = ('extension.js', 'ordering.js', 'metadata.json')
out = Path('dist/gradia-screenshot-race-fix@stan.shell-extension.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(name, name)
PY
```

Reinstall the ZIP, then log out and back in if GNOME does not reload the
updated extension code.

## Remove / rollback

```bash
gnome-extensions disable gradia-screenshot-race-fix@stan
gnome-extensions uninstall gradia-screenshot-race-fix@stan
```
