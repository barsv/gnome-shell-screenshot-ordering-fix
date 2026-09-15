// Keep the portal's `closed` signal behind the asynchronous save operation.
// GNOME upstream fix: gnome-shell!3803. This adapts the ordering fix to an
// extension; the existing capture-button callback is already bound by Shell.
export function installOrderingFix(ui) {
    const originalSave = ui._saveScreenshot;
    const originalFinish = ui._finishClosing;
    const saveDescriptor = Object.getOwnPropertyDescriptor(ui, '_saveScreenshot');
    const finishDescriptor = Object.getOwnPropertyDescriptor(ui, '_finishClosing');
    let pending = 0;
    let deferredFinish = null;

    async function save(...args) {
        pending++;
        try {
            return await originalSave.apply(this, args);
        } finally {
            pending--;
            if (pending === 0 && deferredFinish) {
                const request = deferredFinish;
                deferredFinish = null;
                originalFinish.apply(request.receiver, request.args);
            }
        }
    }

    function finish(...args) {
        if (pending > 0) {
            deferredFinish = {receiver: this, args};
            return;
        }
        return originalFinish.apply(this, args);
    }

    ui._saveScreenshot = save;
    ui._finishClosing = finish;

    return () => {
        // Preserve overrides installed by another extension after ours.
        if (ui._saveScreenshot === save) {
            if (saveDescriptor)
                Object.defineProperty(ui, '_saveScreenshot', saveDescriptor);
            else
                delete ui._saveScreenshot;
        }
        if (ui._finishClosing === finish) {
            if (finishDescriptor)
                Object.defineProperty(ui, '_finishClosing', finishDescriptor);
            else
                delete ui._finishClosing;
        }
    };
}
