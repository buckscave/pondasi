<?php
/* server.php — PHP backend untuk pondasi
   Endpoint: list, read, write, delete, export, ping
   Jalankan: php -S localhost:8000
   Buka: http://localhost:8000/index.html
*/

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');

$baseDir = __DIR__ . '/kerja/';
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

// Buat folder kerja kalau belum ada
if (!is_dir($baseDir)) {
    mkdir($baseDir, 0755, true);
}

function sendJson($data) {
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function sanitizeName($name) {
    $name = preg_replace('/[^a-zA-Z0-9_-]/', '-', $name);
    $name = trim($name, '-');
    return $name;
}

switch ($action) {
    case 'ping':
        sendJson(['ok' => true, 'message' => 'pondasi server aktif']);
        break;

    case 'list':
        $files = glob($baseDir . '*.json');
        $projects = [];
        foreach ($files as $file) {
            $content = file_get_contents($file);
            $data = json_decode($content, true);
            if ($data) {
                $projects[] = [
                    'id' => basename($file, '.json'),
                    'name' => isset($data['name']) ? $data['name'] : basename($file, '.json'),
                    'modifiedAt' => isset($data['modifiedAt']) ? $data['modifiedAt'] : filemtime($file) * 1000,
                    'createdAt' => isset($data['createdAt']) ? $data['createdAt'] : filemtime($file) * 1000,
                    'regionCount' => isset($data['tree']['children']) ? count($data['tree']['children']) : 0
                ];
            }
        }
        // Sort by modifiedAt desc
        usort($projects, function($a, $b) {
            return ($b['modifiedAt'] ?? 0) - ($a['modifiedAt'] ?? 0);
        });
        sendJson(['ok' => true, 'projects' => $projects]);
        break;

    case 'read':
        $id = isset($_GET['id']) ? sanitizeName($_GET['id']) : '';
        if (!$id) sendJson(['ok' => false, 'error' => 'ID tidak boleh kosong']);
        $file = $baseDir . $id . '.json';
        if (!file_exists($file)) sendJson(['ok' => false, 'error' => 'Dokumen tidak ditemukan']);
        $content = file_get_contents($file);
        $data = json_decode($content, true);
        if (!$data) sendJson(['ok' => false, 'error' => 'Format dokumen tidak valid']);
        sendJson(['ok' => true, 'data' => $data]);
        break;

    case 'write':
        $id = isset($_POST['id']) ? sanitizeName($_POST['id']) : '';
        $data = isset($_POST['data']) ? $_POST['data'] : '';
        if (!$id) sendJson(['ok' => false, 'error' => 'ID tidak boleh kosong']);
        if (!$data) sendJson(['ok' => false, 'error' => 'Data tidak boleh kosong']);
        $file = $baseDir . $id . '.json';
        $result = file_put_contents($file, $data);
        if ($result === false) sendJson(['ok' => false, 'error' => 'Gagal menulis file']);
        sendJson(['ok' => true, 'message' => 'Dokumen tersimpan']);
        break;

    case 'delete':
        $id = isset($_GET['id']) ? sanitizeName($_GET['id']) : '';
        if (!$id) sendJson(['ok' => false, 'error' => 'ID tidak boleh kosong']);
        $file = $baseDir . $id . '.json';
        if (!file_exists($file)) sendJson(['ok' => false, 'error' => 'Dokumen tidak ditemukan']);
        unlink($file);
        sendJson(['ok' => true, 'message' => 'Dokumen dihapus']);
        break;

    case 'export':
        // Export file ke folder ekspor
        $nama = isset($_POST['nama']) ? sanitizeName($_POST['nama']) : 'pondasi-export';
        $content = isset($_POST['content']) ? $_POST['content'] : '';
        $ext = isset($_POST['ext']) ? sanitizeName($_POST['ext']) : 'html';
        if (!$content) sendJson(['ok' => false, 'error' => 'Konten tidak boleh kosong']);
        $exportDir = __DIR__ . '/ekspor/';
        if (!is_dir($exportDir)) mkdir($exportDir, 0755, true);
        $file = $exportDir . $nama . '.' . $ext;
        $result = file_put_contents($file, $content);
        if ($result === false) sendJson(['ok' => false, 'error' => 'Gagal menulis file ekspor']);
        sendJson(['ok' => true, 'message' => 'File diekspor ke: ekspor/' . $nama . '.' . $ext, 'path' => 'ekspor/' . $nama . '.' . $ext]);
        break;

    case 'list-export':
        $exportDir = __DIR__ . '/ekspor/';
        if (!is_dir($exportDir)) sendJson(['ok' => true, 'files' => []]);
        $files = array_diff(scandir($exportDir), ['.', '..']);
        $list = [];
        foreach ($files as $file) {
            $path = $exportDir . $file;
            $list[] = [
                'name' => $file,
                'size' => filesize($path),
                'modified' => filemtime($path) * 1000
            ];
        }
        sendJson(['ok' => true, 'files' => $list]);
        break;

    default:
        sendJson(['ok' => false, 'error' => 'Action tidak dikenal: ' . $action]);
}
