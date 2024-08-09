<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if ($user_id !== null) {
    // Fetch user-specific statistics
    $stmt = $pdo->prepare('SELECT user_id, full_name FROM users WHERE user_id = :user_id');
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $stmt = $pdo->prepare('
            SELECT 
                id,
                user_id,
                datetime,
                check_type,
                attendance_status,
                CASE 
                    WHEN TIME(datetime) > "09:45:00" THEN 1 
                    ELSE 0 
                END AS late
            FROM attendance_records 
            WHERE user_id = :user_id
        ');
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $attendance_status = $stmt->fetchAll(PDO::FETCH_ASSOC);

        header('Content-Type: application/json');
        echo json_encode(['user' => $user, 'attendance_status' => $attendance_status]);
    } else {
        echo json_encode(['error' => 'User not found']);
    }
} else {
    // Fetch general statistics
    $totalRecordsStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records');
    $totalRecords = $totalRecordsStmt->fetchColumn();

    $presentStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND attendance_status > 0');
    $present = $presentStmt->fetchColumn();

    $absentStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND attendance_status = 0');
    $absent = $absentStmt->fetchColumn();

    $IzinStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND attendance_status > 0');
    $Izin = $IzinStmt->fetchColumn();

    $sakitStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND attendance_status = 0');
    $sakit = $sakitStmt->fetchColumn();

    $alfaStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND attendance_status = 0');
    $alfa = $alfaStmt->fetchColumn();

    $lateStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND TIME(datetime) > "09:45:00"');
    $late = $lateStmt->fetchColumn();

    $onTimeStmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND TIME(datetime) <= "09:45:00"');
    $onTime = $onTimeStmt->fetchColumn();

    $late15to30Stmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND TIME(datetime) BETWEEN "09:45:01" AND "10:00:00"');
    $late15to30 = $late15to30Stmt->fetchColumn();

    $late30to60Stmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND TIME(datetime) BETWEEN "10:00:01" AND "10:30:00"');
    $late30to60 = $late30to60Stmt->fetchColumn();

    $late60Stmt = $pdo->query('SELECT COUNT(*) FROM attendance_records WHERE attendance_status IS NOT NULL AND TIME(datetime) > "10:30:00"');
    $late60 = $late60Stmt->fetchColumn();

    $dateWiseStmt = $pdo->query('
        SELECT DATE(datetime) as date, 
               SUM(CASE WHEN TIME(datetime) > "09:45:00" THEN 1 ELSE 0 END) as late_count, 
               SUM(CASE WHEN TIME(datetime) <= "09:45:00" THEN 1 ELSE 0 END) as on_time_count
        FROM attendance_records 
        GROUP BY DATE(datetime)
        ORDER BY DATE(datetime)
    ');
    $dateWiseStats = $dateWiseStmt->fetchAll(PDO::FETCH_ASSOC);

    $statistics = [
        'total_records' => $totalRecords,
        'present' => $present,
        'absent' => $absent,
        'Izin' => $Izin,
        'sakit' => $sakit,
        'alfa' => $alfa,
        'late' => $late,
        'on_time' => $onTime,
        'late_15_30' => $late15to30,
        'late_30_60' => $late30to60,
        'late_60' => $late60,
        'date_wise' => $dateWiseStats
    ];

    header('Content-Type: application/json');
    echo json_encode($statistics);
}
?>
