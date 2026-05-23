/**
 * WIP Dashboard — dashboard.js
 * Demo mode: pure JS, no server needed.
 * Real mode: fetches from dashboard.php (requires PHP server).
 */

(function () {
    'use strict';

    // ── Config ────────────────────────────────────────────────────────────────
    const CONFIG = {
        refreshInterval: 30_000,
        apiEndpoint:     'dashboard.php',
        shift: {
            name:  'Night Shift',
            hours: ['20:00','21:00','22:00','23:00','24:00',
                    '1:00','2:00','3:00','4:00','5:00','6:00','7:00'],
        },
        processes: ['PACKING', 'REWORK'],
    };

    // ── Demo data ─────────────────────────────────────────────────────────────
    // Realistic night-shift numbers — safely fictional
    const DEMO_HOURLY = {
        'PACKING': {
            wip: 14,
            plan_total: 480,
            hours: {
                '20:00': { plan: 40, actual: 38 },
                '21:00': { plan: 40, actual: 42 },
                '22:00': { plan: 40, actual: 39 },
                '23:00': { plan: 40, actual: 35 },
                '24:00': { plan: 40, actual: 41 },
                '1:00':  { plan: 40, actual: 40 },
                '2:00':  { plan: 40, actual: 37 },
                '3:00':  { plan: 40, actual: 0  },
                '4:00':  { plan: 40, actual: 0  },
                '5:00':  { plan: 40, actual: 0  },
                '6:00':  { plan: 40, actual: 0  },
                '7:00':  { plan: 40, actual: 0  },
            }
        },
        'REWORK': {
            wip: 6,
            plan_total: 120,
            hours: {
                '20:00': { plan: 10, actual: 8  },
                '21:00': { plan: 10, actual: 11 },
                '22:00': { plan: 10, actual: 10 },
                '23:00': { plan: 10, actual: 7  },
                '24:00': { plan: 10, actual: 10 },
                '1:00':  { plan: 10, actual: 9  },
                '2:00':  { plan: 10, actual: 10 },
                '3:00':  { plan: 10, actual: 0  },
                '4:00':  { plan: 10, actual: 0  },
                '5:00':  { plan: 10, actual: 0  },
                '6:00':  { plan: 10, actual: 0  },
                '7:00':  { plan: 10, actual: 0  },
            }
        },
    };

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const els = {
        banner:         document.getElementById('modeBanner'),
        shiftTitle:     document.getElementById('shiftTitle'),
        modelBadge:     document.getElementById('modelBadge'),
        woLabel:        document.getElementById('woLabel'),
        dashTable:      document.getElementById('dashTable'),
        timestamp:      document.getElementById('timestamp'),
        refreshBtn:     document.getElementById('refreshBtn'),
        modeToggle:     document.getElementById('modeToggle'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        errorMsg:       document.getElementById('errorMsg'),
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    function getMode() {
        return new URLSearchParams(window.location.search).get('mode') === 'demo' ? 'demo' : 'real';
    }

    function setLoading(on) {
        if (els.loadingOverlay) els.loadingOverlay.style.display = on ? 'flex' : 'none';
    }

    function showError(msg) {
        if (!els.errorMsg) return;
        els.errorMsg.textContent = msg;
        els.errorMsg.style.display = 'block';
        setTimeout(() => { els.errorMsg.style.display = 'none'; }, 6000);
    }

    function nowString() {
        return new Date().toLocaleString('en-MY', { hour12: false });
    }

    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Build table ───────────────────────────────────────────────────────────

    function buildTable(processes, hourly) {
        const procs  = Object.keys(hourly);
        const hours  = CONFIG.shift.hours;
        const cols   = procs.length; // number of process groups

        // ── Compute totals & yield per process
        const totals = {};
        procs.forEach(p => {
            let sumPlan = 0, sumActual = 0;
            hours.forEach(h => {
                const r = hourly[p].hours[h] || { plan: 0, actual: 0 };
                sumPlan   += r.plan;
                sumActual += r.actual;
            });
            totals[p] = { plan: sumPlan, actual: sumActual };
            const yieldPct = sumPlan > 0 ? Math.round((sumActual / sumPlan) * 100) : 100;
            totals[p].yield = yieldPct;
        });

        // ── Header rows
        let html = `<thead>`;

        // Row 1: Time | PACKING (colspan 3) | REWORK (colspan 3) …
        html += `<tr class="row-header-process">
            <th class="col-time">Time</th>`;
        procs.forEach(p => {
            html += `<th colspan="3" class="col-process-name">${escHtml(p)}</th>`;
        });
        html += `</tr>`;

        // Row 2: WIP
        html += `<tr class="row-wip">
            <td class="col-label">WIP</td>`;
        procs.forEach(p => {
            html += `<td colspan="3" class="col-wip-val">${hourly[p].wip}</td>`;
        });
        html += `</tr>`;

        // Row 3: Plan total
        html += `<tr class="row-plan-total">
            <td class="col-label">Plan</td>`;
        procs.forEach(p => {
            html += `<td colspan="3" class="col-plan-val">${totals[p].plan}</td>`;
        });
        html += `</tr>`;

        // Row 4: Yield
        html += `<tr class="row-yield">
            <td class="col-label">Yield</td>`;
        procs.forEach(p => {
            const y = totals[p].yield;
            const cls = y >= 95 ? 'yield-good' : y >= 80 ? 'yield-warn' : 'yield-crit';
            html += `<td colspan="3" class="${cls}">${y}%</td>`;
        });
        html += `</tr>`;

        // Row 5: Sub-headers Plan / Actual / Delta per process
        html += `<tr class="row-subheader">
            <th class="col-label">Hour</th>`;
        procs.forEach(() => {
            html += `<th>Plan</th><th>Actual</th><th>Delta</th>`;
        });
        html += `</tr>`;

        html += `</thead><tbody>`;

        // ── Hour rows
        hours.forEach((h, i) => {
            const rowClass = i % 2 === 0 ? 'row-even' : 'row-odd';
            html += `<tr class="${rowClass}">
                <td class="col-time-val">${escHtml(h)}</td>`;
            procs.forEach(p => {
                const r = hourly[p].hours[h] || { plan: 0, actual: 0 };
                const delta = r.actual - r.plan;
                const dSign = delta > 0 ? '+' : '';
                const dCls  = delta >= 0 ? 'delta-pos' : (delta < -5 ? 'delta-crit' : 'delta-neg');
                const isPast = r.actual > 0;
                html += `
                    <td class="col-plan">${r.plan}</td>
                    <td class="col-actual ${isPast ? 'has-actual' : 'no-actual'}">${r.actual}</td>
                    <td class="col-delta ${dCls}">${isPast ? dSign + delta : '—'}</td>`;
            });
            html += `</tr>`;
        });

        // ── Totals row
        html += `<tr class="row-totals">
            <td class="col-label">Total</td>`;
        procs.forEach(p => {
            const t = totals[p];
            const delta = t.actual - t.plan;
            const dSign = delta > 0 ? '+' : '';
            const dCls  = delta >= 0 ? 'delta-pos' : (delta < -5 ? 'delta-crit' : 'delta-neg');
            html += `
                <td class="col-plan">${t.plan}</td>
                <td class="col-actual has-actual">${t.actual}</td>
                <td class="col-delta ${dCls}">${dSign}${delta}</td>`;
        });
        html += `</tr></tbody>`;

        return html;
    }

    // ── Render ────────────────────────────────────────────────────────────────

    function renderBanner(mode) {
        if (!els.banner) return;
        if (mode === 'demo') {
            els.banner.className = 'banner demo';
            els.banner.innerHTML = '⚠ DEMO MODE — Simulated data only, safe for portfolio viewing';
        } else {
            els.banner.className = 'banner real';
            els.banner.innerHTML = '🟢 LIVE MODE — Real ERP + MES data';
        }
    }

    function renderDashboard(payload) {
        if (els.shiftTitle) els.shiftTitle.textContent = payload.shift || CONFIG.shift.name;
        if (els.modelBadge) els.modelBadge.textContent = `Model: ${payload.model || 'Demo Model A'}`;
        if (els.woLabel)    els.woLabel.textContent    = `WO(s): ${payload.wo || 'WO-20250523-001, WO-20250523-002'}`;
        if (els.timestamp)  els.timestamp.textContent  = `Last updated: ${payload.timestamp}`;
        if (els.dashTable)  els.dashTable.innerHTML    = buildTable(CONFIG.processes, payload.hourly);
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    function loadDemo() {
        return {
            mode:      'demo',
            timestamp: nowString(),
            shift:     CONFIG.shift.name,
            model:     'Demo Model A',
            wo:        'WO-20250523-001, WO-20250523-002',
            hourly:    DEMO_HOURLY,
        };
    }

    async function fetchReal() {
        const res = await fetch(`${CONFIG.apiEndpoint}?mode=real&_=${Date.now()}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return await res.json();
    }

    async function loadData() {
        setLoading(true);
        try {
            const payload = getMode() === 'demo' ? loadDemo() : await fetchReal();
            renderBanner(payload.mode);
            renderDashboard(payload);
        } catch (err) {
            console.error('[WIP Dashboard]', err);
            showError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    // ── Auto-refresh ──────────────────────────────────────────────────────────
    let refreshTimer = null;

    function startRefresh() {
        if (getMode() === 'real' && CONFIG.refreshInterval > 0)
            refreshTimer = setInterval(loadData, CONFIG.refreshInterval);
    }
    function stopRefresh() {
        if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopRefresh();
        else { loadData(); startRefresh(); }
    });

    // ── Event listeners ───────────────────────────────────────────────────────
    if (els.refreshBtn) els.refreshBtn.addEventListener('click', () => {
        stopRefresh(); loadData(); startRefresh();
    });

    if (els.modeToggle) els.modeToggle.addEventListener('click', () => {
        const next = getMode() === 'demo' ? 'real' : 'demo';
        const url  = new URL(window.location.href);
        url.searchParams.set('mode', next);
        window.location.href = url.toString();
    });

    // ── Init ──────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        loadData();
        startRefresh();
    });

})();
