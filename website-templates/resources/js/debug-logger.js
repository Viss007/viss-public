/**
 * Client-side sink for the local debug-logger (FastAPI POST /log).
 * Matches debug-logger/main.py LogBody: { event, details?, duration? }.
 * Auto-captured: client.error (runtime errors), client.promise.failed (unhandled rejections).
 */

const DEBUG_LOGGER_URL = 'http://127.0.0.1:8840/log';

function normalizeDetails(details) {
    if (details === null || details === undefined) {
        return null;
    }
    if (typeof details === 'string') {
        return details === '' ? null : details;
    }
    if (typeof details === 'object') {
        try {
            return JSON.stringify(details);
        } catch {
            return String(details);
        }
    }
    return String(details);
}

function postLog(eventName, details, duration) {
    const event = String(eventName).trim();
    if (!event) {
        return;
    }

    const payload = { event };
    const d = normalizeDetails(details);
    if (d !== null) {
        payload.details = d;
    }
    if (typeof duration === 'number' && !Number.isNaN(duration)) {
        payload.duration = duration;
    }

    fetch(DEBUG_LOGGER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'cors',
        credentials: 'omit',
        keepalive: true,
    }).catch(() => { });
}

const DebugLogger = {
    _installed: false,

    /**
     * @param {string} event
     * @param {unknown} [details]
     * @param {number} [duration] seconds (optional, matches server)
     */
    event(event, details, duration) {
        postLog(event, details, duration);
    },

    init() {
        if (this._installed) {
            return;
        }
        this._installed = true;

        window.addEventListener(
            'error',
            (ev) => {
                this.event('client.error', {
                    message: ev.message || 'error',
                    filename: ev.filename || '',
                    lineno: ev.lineno || 0,
                    colno: ev.colno || 0,
                    stack: ev.error && ev.error.stack ? String(ev.error.stack) : '',
                });
            },
            true
        );

        window.addEventListener('unhandledrejection', (ev) => {
            const r = ev.reason;
            this.event('client.promise.failed', {
                message: r && r.message ? String(r.message) : String(r),
                stack: r && r.stack ? String(r.stack) : '',
            });
        });
    },
};

window.DebugLogger = DebugLogger;

export default DebugLogger;
