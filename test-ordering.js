import {installOrderingFix} from './ordering.js';
function assert(condition, message) { if (!condition) throw new Error(message); }
for (const failure of [false, true]) {
    const events = [];
    let resolveSave, rejectSave;
    const gate = new Promise((resolve, reject) => { resolveSave = resolve; rejectSave = reject; });
    const proto = {
        async _saveScreenshot() {
            events.push('saving');
            await gate;
            events.push('screenshot-taken');
        },
        _finishClosing() { events.push('closed'); },
    };
    const ui = Object.create(proto);
    const restore = installOrderingFix(ui);
    const task = ui._saveScreenshot().catch(() => events.push('error'));
    ui._finishClosing();
    assert(events.join(',') === 'saving', 'close overtook save');
    if (failure) rejectSave(new Error('test')); else resolveSave();
    await task;
    assert(events.join(',') === (failure ? 'saving,closed,error' : 'saving,screenshot-taken,closed'), 'wrong completion order');
    restore();
    assert(!Object.hasOwn(ui, '_saveScreenshot') && !Object.hasOwn(ui, '_finishClosing'), 'original prototype not restored');
    assert(ui._saveScreenshot === proto._saveScreenshot, 'save not restored');
}
const events = [];
const ui = {_saveScreenshot: async () => {}, _finishClosing: () => events.push('closed')};
const original = ui._finishClosing;
const restore = installOrderingFix(ui);
ui._finishClosing();
assert(events.length === 1, 'ordinary cancel delayed');
restore();
assert(ui._finishClosing === original, 'own method not restored');
print('PASS: successful save, failed save, ordinary cancellation, restoration');
