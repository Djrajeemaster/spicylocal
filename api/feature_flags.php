<?php
// API to get and set feature flags
// Flags allow super admins to enable/disable parts of the application dynamically.

header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';
session_start();

// Initialize feature_flags table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS feature_flags (
  feature_name VARCHAR(50) PRIMARY KEY,
  is_enabled TINYINT(1) NOT NULL DEFAULT 1
)");

// Initialize audit_logs table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(255),
  admin_user VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT
)");

// Helper to record audit logs
function record_audit($pdo, $action, $admin_user, $details) {
    $stmt = $pdo->prepare("INSERT INTO audit_logs (action, admin_user, details) VALUES (:action, :admin_user, :details)");
    $stmt->execute([
        ':action' => $action,
        ':admin_user' => $admin_user,
        ':details' => json_encode($details)
    ]);
}

// GET: list flags
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT feature_name, is_enabled FROM feature_flags");
        $flags = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $flags[$row['feature_name']] = (bool)$row['is_enabled'];
        }
        // If no flags defined yet, define defaults for all known features
        if (empty($flags)) {
            $defaultFlags = [
                'ai_summary' => true,
                'auto_categorization' => true,
                'tag_suggestions' => true,
                'search_assist' => true,
                'why_this_deal' => true,
                'gamification' => true,
                'leaderboard' => true,
                'personalized_feed' => true,
                'bookmark_sorting' => true,
                'comment_reactions' => true,
                'multilanguage' => true,
                'super_admin_tools' => true
            ];
            $stmtInsert = $pdo->prepare("INSERT INTO feature_flags (feature_name, is_enabled) VALUES (:name, :enabled) ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)");
            foreach ($defaultFlags as $name => $enabled) {
                $stmtInsert->execute([':name' => $name, ':enabled' => $enabled]);
            }
            $flags = $defaultFlags;
        }
        // Also return role information for client-side role-based decisions (e.g., super admin UI)
        if (isset($_SESSION['role'])) {
            $flags['_role'] = $_SESSION['role'];
            $flags['_is_super_admin'] = ($_SESSION['role'] === 'super_admin');
        }
        echo json_encode($flags);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Error retrieving feature flags']);
    }
    exit;
}

// POST: update a flag (super admin only)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    $data = json_decode(file_get_contents('php://input'), true);
    $feature = $data['feature_name'] ?? '';
    $isEnabled = isset($data['is_enabled']) ? (int)$data['is_enabled'] : 0;
    if ($feature === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid feature']);
        exit;
    }
    try {
        $stmt = $pdo->prepare("INSERT INTO feature_flags (feature_name, is_enabled) VALUES (:name, :enabled)
            ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled)");
        $stmt->execute([':name' => $feature, ':enabled' => $isEnabled]);
        $adminUser = $_SESSION['username'] ?? 'super_admin';
        record_audit($pdo, 'toggle_feature', $adminUser, ['feature' => $feature, 'is_enabled' => $isEnabled]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error updating feature flag']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>