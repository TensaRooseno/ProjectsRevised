<?php
require_once 'config.php'; 

// Establish Database Connection
try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

// Fetch Records
$id = isset($_GET['id']) ? $_GET['id'] : null; 
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null; 
$attendance_status = isset($_GET['attendance_status']) ? $_GET['attendance_status'] : null; 
$name = isset($_GET['name']) ? $_GET['name'] : null; 
$is_late = isset($_GET['is_late']) ? $_GET['is_late'] : null; 
$attendance_type = isset($_GET['attendance_type']) ? $_GET['attendance_type'] : null; 

// attendance_status Status Mapping (renamed for clarity)
$attendanceStatusMapping = [ 
    '0' => 'Absent', 
    '1' => 'Present', 
    '2' => 'Izin',
    '3' => 'Sakit',
    '4' => 'Alfa'
];

// Query Construction
$query = 'SELECT ar.*, u.full_name FROM attendance_records ar 
          JOIN users u ON ar.user_id = u.user_id WHERE 1=1';
$params = [];

// Add filters to query based on parameters
if ($id !== null && $id !== '') {
    $query .= ' AND ar.id = :id';
    $params[':id'] = $id;
}

if ($user_id !== null && $user_id !== '') {
    $query .= ' AND ar.user_id LIKE :user_id';
    $params[':user_id'] = '%' . $user_id . '%';
}

if ($attendance_status !== null && $attendance_status !== '') { // Updated column name
    $query .= ' AND ar.attendance_status = :attendance_status'; // Updated column name
    $params[':attendance_status'] = $attendance_status; 
}

if ($name !== null && $name !== '') {
    $query .= ' AND u.full_name LIKE :name';
    $params[':name'] = '%' . $name . '%';
}

if ($is_late !== null) {
    $query .= ' AND ar.is_late = :is_late';
    $params[':is_late'] = $is_late;
}

if ($attendance_type !== null) {
    $query .= ' AND ar.attendance_type = :attendance_type';
    $params[':attendance_type'] = $attendance_type;
}

// Execute Query with Prepared Statement
$stmt = $pdo->prepare($query);
error_log("Query: $query");
error_log("Params: " . json_encode($params));

// Check if query execution is successful
if (!$stmt->execute($params)) {
    error_log("Error executing query: " . json_encode($stmt->errorInfo()));
    http_response_code(500); 
    echo json_encode(["error" => "An error occurred while fetching data."]);
    exit();
}

$records = $stmt->fetchAll(PDO::FETCH_ASSOC); 
error_log("Fetched records: " . json_encode($records)); 

// Translate attendance_status status back to keywords for display
foreach ($records as &$record) {
    $record['attendance_status_text'] = $attendanceStatusMapping[$record['attendance_status']] ?? 'Unknown'; 

    // Check for check-out based on DateTime (consider making threshold configurable)
    $datetime = new DateTime($record['datetime']);
    $hour = (int)$datetime->format('H');

    if ($hour >= 17 || $hour < 1) {
        $record['datetime_out'] = $record['datetime'];
        $record['attendance_out'] = 'Present';
    } else {
        $record['datetime_out'] = '-';
        $record['attendance_out'] = '-';
    }
}

header('Content-Type: application/json');
echo json_encode($records);
?>
