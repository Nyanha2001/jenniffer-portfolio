<?php
$mode = $_GET['mode'] ?? 'real';
$isDemo = ($mode === 'demo');

header('Content-Type: application/json');

// =======================
// DEMO DATA
// =======================
function getDemoData() {
    return [
        ["process_code"=>"AOI-BOT","plan"=>120,"actual"=>115,"delta"=>-5,"wip"=>18],
        ["process_code"=>"QA-VMI-INSP-BOT","plan"=>100,"actual"=>98,"delta"=>-2,"wip"=>10],
        ["process_code"=>"FCT","plan"=>90,"actual"=>92,"delta"=>2,"wip"=>6],
        ["process_code"=>"EOL-TEST","plan"=>80,"actual"=>78,"delta"=>-2,"wip"=>4]
    ];
}

// =======================
// REAL DATA PLACEHOLDER
// (replace with your ERP + MES logic)
// =======================
function getRealData() {
    // TODO: replace with your actual DB logic
    return [
        ["process_code"=>"AOI-BOT","plan"=>130,"actual"=>125,"delta"=>-5,"wip"=>22],
        ["process_code"=>"QA-VMI-INSP-BOT","plan"=>110,"actual"=>108,"delta"=>-2,"wip"=>12]
    ];
}

// =======================
// OUTPUT
// =======================
$data = $isDemo ? getDemoData() : getRealData();

echo json_encode([
    "mode" => $mode,
    "data" => $data
]);
?>
