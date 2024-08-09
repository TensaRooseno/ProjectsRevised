<?php
require_once 'config.php';
require 'vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\{Alignment, Border, Fill};

try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Error Handling & Connection (Using try-catch for exceptions)
try {
    $pdo = new PDO("mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']}", $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Fetch Records (Using prepared statements for security)
$stmt = $pdo->prepare('
    SELECT ar.id, ar.user_id, u.full_name, ar.datetime, ar.attendance_status
    FROM attendance_records ar
    JOIN users u ON ar.user_id = u.user_id
');
$stmt->execute();
$records = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Create Spreadsheet
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle('attendance_status Records');

// Column Headers & Styles (Centralized styles for readability)
$headers = ['ID', 'User ID', 'Full Name', 'Date Time', 'Week', 'Month', 'Year', 'attendance_status'];
$headerStyle = [
    'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
    'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
    'borders'   => ['outline' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
];

$sheet->fromArray($headers, null, 'A1');
$sheet->getStyle('A1:H1')->applyFromArray($headerStyle);

// Auto-size Columns
foreach (range('A', 'H') as $columnID) {
    $sheet->getColumnDimension($columnID)->setAutoSize(true);
}

// attendance_status Mapping (Using an array for clarity)
$attendanceMapping = [
    '0'  => 'Absent',
    '1'  => 'Fingerprint Method',
    '16' => 'Face Recognition Method',
];

// Populate Data Rows (Using date-time functions for formatting)
$row = 2;
foreach ($records as $record) {
    $datetime = new DateTime($record['datetime']);
    $week    = (int)$datetime->format('W');
    $month   = $datetime->format('F'); 
    $year    = $datetime->format('Y');

    $sheet->fromArray([
        $record['id'],
        $record['user_id'],
        $record['full_name'],
        $record['datetime'],
        'Week ' . $week,
        $month,
        $year,
        $attendanceMapping[$record['attendance_status']] ?? 'Unknown', 
    ], null, 'A' . $row++); 
}

// Data Row Styles 
$dataStyle = [
    'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
];

$sheet->getStyle('A2:H' . ($row - 1))->applyFromArray($dataStyle);

// Row Heights
foreach (range(1, $row - 1) as $rowIndex) {
    $sheet->getRowDimension($rowIndex)->setRowHeight(20);
}

// Output (Proper headers for download)
$writer = new Xlsx($spreadsheet);
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="attendance_records.xlsx"');
$writer->save('php://output');
