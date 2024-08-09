<?php

require_once 'config.php'; 

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $e->getMessage()]));
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $action = filter_input(INPUT_POST, 'action', FILTER_SANITIZE_STRING);

    if ($action == 'edit') {
        $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        $user_id = filter_input(INPUT_POST, 'user_id', FILTER_SANITIZE_STRING);
        $datetime = filter_input(INPUT_POST, 'datetime', FILTER_SANITIZE_STRING);
        $attendance_status = filter_input(INPUT_POST, 'attendance_status', FILTER_SANITIZE_STRING);
        $check_type = filter_input(INPUT_POST, 'check_type', FILTER_SANITIZE_STRING);

        if ($id && $user_id && $datetime && $attendance_status !== '') {
            try {
                $stmt = $pdo->prepare("UPDATE attendance_records SET user_id = :user_id, datetime = :datetime, attendance_status = :attendance_status, check_type = :check_type WHERE id = :id");
                $stmt->bindParam(':user_id', $user_id);
                $stmt->bindParam(':datetime', $datetime);
                $stmt->bindParam(':attendance_status', $attendance_status);
                $stmt->bindParam(':check_type', $check_type);
                $stmt->bindParam(':id', $id);
                $stmt->execute();

                echo json_encode(['status' => 'success', 'message' => 'Record updated successfully']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Update failed: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid data provided']);
        }

    } elseif ($action == 'delete') {
        $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);

        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM attendance_records WHERE id = :id");
                $stmt->bindParam(':id', $id);
                $stmt->execute();

                echo json_encode(['status' => 'success', 'message' => 'Record deleted successfully']);
            } catch (PDOException $e) {
                echo json_encode(['status' => 'error', 'message' => 'Deletion failed: ' . $e->getMessage()]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
        }

    } elseif ($action == 'delete_all') {
        try {
            $stmt = $pdo->prepare("DELETE FROM attendance_records");
            $stmt->execute();

            echo json_encode(['status' => 'success', 'message' => 'All records deleted successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Deletion failed: ' . $e->getMessage()]);
        }

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }

    exit();

} elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    parse_str(file_get_contents("php://input"), $data);
    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id) {
        try {
            $stmt = $pdo->prepare("DELETE FROM attendance_records WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();

            echo json_encode(['status' => 'success', 'message' => 'Record deleted successfully']);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Deletion failed: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
    }

    exit();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}

?>
