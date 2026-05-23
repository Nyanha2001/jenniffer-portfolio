<?php
/**
 * WIP Dashboard API
 * Returns production data in JSON format.
 * Usage: dashboard.php?mode=demo  OR  dashboard.php?mode=real
 */

// ── Security & headers ──────────────────────────────────────────────────────
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Whitelist the mode parameter to prevent unexpected values
$allowedModes = ['real', 'demo'];
$mode = in_array($_GET['mode'] ?? '', $allowedModes) ? $_GET['mode'] : 'real';
$isDemo = ($mode === 'demo');

// ── Data functions ───────────────────────────────────────────────────────────

/**
 * Returns simulated production data for portfolio/demo purposes.
 * Safe to expose publicly — no real factory data.
 */
function getDemoData(): array {
    return [
        [
            'process_code' => 'AOI-BOT',
            'plan'         => 120,
            'actual'       => 115,
            'delta'        => -5,
            'wip'          => 18,
            'status'       => 'warning',   // behind plan
        ],
        [
            'process_code' => 'QA-VMI-INSP-BOT',
            'plan'         => 100,
            'actual'       => 98,
            'delta'        => -2,
            'wip'          => 10,
            'status'       => 'warning',
        ],
        [
            'process_code' => 'FCT',
            'plan'         => 90,
            'actual'       => 92,
            'delta'        => 2,
            'wip'          => 6,
            'status'       => 'good',      // ahead of plan
        ],
        [
            'process_code' => 'EOL-TEST',
            'plan'         => 80,
            'actual'       => 78,
            'delta'        => -2,
            'wip'          => 4,
            'status'       => 'warning',
        ],
        [
            'process_code' => 'SMT-TOP',
            'plan'         => 200,
            'actual'       => 200,
            'delta'        => 0,
            'wip'          => 0,
            'status'       => 'good',
        ],
        [
            'process_code' => 'SMT-BOT',
            'plan'         => 190,
            'actual'       => 165,
            'delta'        => -25,
            'wip'          => 32,
            'status'       => 'critical',  // significantly behind
        ],
    ];
}

/**
 * Returns live data from ERP + MES.
 * Replace the placeholder array with your actual DB/API query.
 *
 * Example with PDO:
 *   $pdo = new PDO('mysql:host=localhost;dbname=mes_db', $user, $pass);
 *   $stmt = $pdo->query('SELECT process_code, plan, actual, (actual-plan) AS delta, wip FROM v_wip_summary');
 *   return $stmt->fetchAll(PDO::FETCH_ASSOC);
 */
function getRealData(): array {
    // TODO: replace with your actual DB logic
    return [
        [
            'process_code' => 'AOI-BOT',
            'plan'         => 130,
            'actual'       => 125,
            'delta'        => -5,
            'wip'          => 22,
            'status'       => 'warning',
        ],
        [
            'process_code' => 'QA-VMI-INSP-BOT',
            'plan'         => 110,
            'actual'       => 108,
            'delta'        => -2,
            'wip'          => 12,
            'status'       => 'warning',
        ],
    ];
}

// ── Enrich data with derived fields ─────────────────────────────────────────

function enrichData(array $rows): array {
    foreach ($rows as &$row) {
        // Completion percentage (guard against divide-by-zero)
        $row['completion_pct'] = $row['plan'] > 0
            ? round(($row['actual'] / $row['plan']) * 100, 1)
            : 0;

        // Auto-assign status if not already set
        if (!isset($row['status'])) {
            if ($row['delta'] >= 0) {
                $row['status'] = 'good';
            } elseif ($row['delta'] >= -5) {
                $row['status'] = 'warning';
            } else {
                $row['status'] = 'critical';
            }
        }
    }
    return $rows;
}

// ── Build response ───────────────────────────────────────────────────────────

$rawData  = $isDemo ? getDemoData() : getRealData();
$enriched = enrichData($rawData);

$summary = [
    'total_plan'   => array_sum(array_column($enriched, 'plan')),
    'total_actual' => array_sum(array_column($enriched, 'actual')),
    'total_wip'    => array_sum(array_column($enriched, 'wip')),
    'critical'     => count(array_filter($enriched, fn($r) => $r['status'] === 'critical')),
];

echo json_encode([
    'mode'      => $mode,
    'timestamp' => date('Y-m-d H:i:s'),
    'summary'   => $summary,
    'data'      => $enriched,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
