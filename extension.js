import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {installOrderingFix} from './ordering.js';

export default class ScreenshotOrderingFix extends Extension {
    enable() {
        this._restore = installOrderingFix(Main.screenshotUI);
    }

    disable() {
        this._restore?.();
        this._restore = null;
    }
}
