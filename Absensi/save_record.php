<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

// Ensure required data is present
if (
    isset($_POST['id']) && 
    isset($_POST['user_id']) && 
    isset($_POST['datetime_in']) && 
    isset($_POST['attendance_status']) && 
    isset($_POST['attendance_type']) // Include attendance_type
) {
    $id = $_POST['id'];
    $user_id = filter_var($_POST['user_id'], FILTER_SANITIZE_NUMBER_INT); // Sanitize user_id
    $datetime_in = $_POST['datetime_in'];
    $datetime_out = $_POST['datetime_out'];
    $attendance_status = $_POST['attendance_status'];
    $attendance_type = $_POST['attendance_type']; // Include attendance_type
    $is_late_in = $_POST['is_late_in'];
    $is_late_out = $_POST['is_late_out'];

    try {
        // Determine check_type based on whether datetime_out is provided AND it's different from datetime_in
        $check_type = ($datetime_out !== '' && $datetime_out !== $datetime_in) ? 1 : 0; 

        // Prepare and execute the update statement using prepared statements
        $sql = "UPDATE attendance_records 
                SET user_id = :user_id, 
                    datetime = :datetime_in, 
                    datetime_out = :datetime_out,
                    attendance_status = :attendance_status, 
                    check_type = :check_type,
                    attendance_type = :attendance_type, // Include attendance_type
                    is_late = :is_late_in 
                WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':user_id' => $user_id,
            ':datetime_in' => $datetime_in,
            ':datetime_out' => $datetime_out,
            ':attendance_status' => $attendance_status,
            ':check_type' => $check_type,
            ':attendance_type' => $attendance_type, // Include attendance_type
            ':is_late_in' => $is_late_in,
            ':id' => $id
        ]);

        // If check-out exists, update is_late_out separately
        if ($check_type == 1) {
            $sql_out = "UPDATE attendance_records SET is_late_out = :is_late_out WHERE id = :id";
            $stmt_out = $pdo->prepare($sql_out);
            $stmt_out->execute([':is_late_out' => $is_late_out, ':id' => $id]);
        }

        echo json_encode(['status' => 'success', 'message' => 'Record updated successfully']);
    } catch (PDOException $e) {
        // Log the error for debugging
        error_log("Error updating record: " . $e->getMessage());

        // Provide a more specific error message to the user
        $errorMessage = 'Update failed.';
        if ($e->getCode() == 23000) { // Duplicate entry error
            $errorMessage .= ' There might be a duplicate record for this user and date.';
        } else {
            $errorMessage .= ' Please try again later.';
        }

        echo json_encode(['status' => 'error', 'message' => $errorMessage]); 
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Missing required data']);
}

// $pdo = null; // Optional: Close the connection explicitly
?>
