// Inisialisasi flatpickr pada elemen input tanggal
document.addEventListener('DOMContentLoaded', function () {
    flatpickr('.datetimepicker', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
    });
    fetchRecords(); // Fetch records when the document is loaded
});

function fetchRecords() {
    // Declare filter element variables at the beginning of the function
    let idFilterElement, userIdFilterElement, attendanceStatusFilterElement, nameFilterElement, lateFilterElement; 
    // Get references to filter elements
    idFilterElement = document.getElementById('idFilter');
    userIdFilterElement = document.getElementById('userIdFilter');
    attendanceStatusFilterElement = document.getElementById('attendance_statusFilter');
    nameFilterElement = document.getElementById('nameFilter');
    lateFilterElement = document.getElementById('lateFilter');
    // Log the elements to the console for debugging (optional)
    console.log('idFilterElement:', idFilterElement); 
    console.log('userIdFilterElement:', userIdFilterElement); 
    // ... (log other filter elements)
    // Get filter values, handling null cases
    const idFilter = idFilterElement ? idFilterElement.value : ''; 
    const userIdFilter = userIdFilterElement ? userIdFilterElement.value : '';
    const attendance_statusFilter = attendanceStatusFilterElement ? attendanceStatusFilterElement.value : '';
    const nameFilter = nameFilterElement ? nameFilterElement.value : '';
    const lateFilter = lateFilterElement ? lateFilterElement.value : '';

    fetch(`../fetch_records.php?id=${idFilter}&user_id=${userIdFilter}&attendance_status=${attendance_statusFilter}&name=${nameFilter}&is_late=${lateFilter}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok'); 
            }
            return response.json(); 
        })
        .then(data => {
            console.log('Fetched data:', data);   

            displayRecords(data);
        })
        .catch(error => {
            console.error('Error fetching or parsing records:', error);
            // Display a user-friendly error message on the page
            document.getElementById('records').innerHTML = '<div class="alert alert-danger">An error occurred while fetching attendance_status records.</div>';
        });
}

function displayRecords(data) {
    const recordsDiv = document.getElementById('records');
    let table = '<table class="table table-bordered"><tr><th>ID</th><th>User ID</th><th>Full Name</th><th>Check In</th><th>Check Out</th><th>Attendance Status</th><th>Late Status (In/Out)</th><th>Actions</th></tr>';

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "--Weekend--"];

    const groupedData = {};
    let dayIds = {}; // To keep track of IDs for each day

    data.forEach(record => {
        const date = record.datetime.split(' ')[0]; // Extract date part
        const key = `${record.user_id}_${date}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                id: record.id, // Include the original record ID
                user_id: record.user_id,
                full_name: record.full_name,
                date: date,
                check_in: null,
                check_out: null,
                attendance_status: null, 
                is_late: null 
            };
        }
        if (record.check_type === 0) { // Check-in
            groupedData[key].check_in = record.datetime;
            groupedData[key].is_late = record.is_late; // Assume late status is associated with check-in
        } else if (record.check_type === 1) { // Check-out
            groupedData[key].check_out = record.datetime;
        }
    });

    Object.values(groupedData).forEach(record => {
        if (record.check_in && record.check_out) {
            record.attendance_status = 'Present';
        } else if (record.check_in) {
            record.attendance_status = 'Belum Checkout'; 
        } else {
            record.attendance_status = 'Absent'; 
        }
    });

// Generate table rows (modified)
    Object.values(groupedData).forEach(record => {
        // Check if check-out is late (if available)
        let isLateOut = record.check_out ? isLate(new Date(record.check_out)) : '-'; 
    });
    if (Object.keys(groupedData).length === 0) {
        // No records found, display a message
        table += '<tr><td colspan="8" class="text-center">No records found.</td></tr>';
    } else {
        // Generate table rows (modified)
        Object.values(groupedData).forEach(record => {
            // Check if check-out is late (if available)
            let isLateOut = record.check_out ? isLate(new Date(record.check_out)) : '-';

            table += `<tr>
                <td>${record.id}</td> 
                <td><input type="text" value="${record.user_id}" id="user_id_${record.id}" class="form-control"></td>
                <td>${record.full_name}</td>
                <td><input type="datetime-local" value="${record.check_in ? record.check_in.replace(' ', 'T') : ''}" id="datetime_${record.id}_in" class="form-control datetimepicker"></td>
                <td><input type="datetime-local" value="${record.check_out ? record.check_out.replace(' ', 'T') : ''}" id="datetime_${record.id}_out" class="form-control datetimepicker"></td>
                <td>
                    <select id="attendance_status_${record.id}" class="form-control">
                        <option value="0" ${record.attendance_status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="1" ${record.attendance_status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="2" ${record.attendance_status === 'Izin' ? 'selected' : ''}>Izin</option>
                        <option value="3" ${record.attendance_status === 'Sakit' ? 'selected' : ''}>Sakit</option>
                        <option value="4" ${record.attendance_status === 'Alfa' ? 'selected' : ''}>Alfa</option> 
                        <option value="5" ${record.attendance_status === 'Belum Checkout' ? 'selected' : ''}>Belum Checkout</option> 
                    </select>
                </td>
                <td>${record.is_late === 1 ? 'Late' : 'On Time'} / ${isLateOut}</td> 
                <td>
                    <button onclick="saveRecord(${record.id})" class="btn btn-primary"> 
                        <i class="fas fa-pen"></i> Save Change
                    </button>
                    <button onclick="deleteRecord(${record.id})" class="btn btn-danger">Delete</button>
                </td>
            </tr>`;
        });
    }

    table += '</table>';
    recordsDiv.innerHTML = table;

    // Re-initialize flatpickr
    flatpickr('.datetimepicker', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
    });

    recordsDiv.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON' && event.target.textContent.trim() === 'Save Change') {
            const row = event.target.closest('tr');
            const id = row.cells[0].textContent; 
            saveRecord(id);
        }
    });
}

function isLate(datetime) {
    const threshold = new Date(datetime);
    const checkTime = new Date(threshold.getFullYear(), threshold.getMonth(), threshold.getDate(), 9, 30, 0); // 09:30 AM
    return threshold > checkTime ? 'Late' : 'On Time';
}

function saveRecord(id) {

    // Get element references first
    const userIdElement = document.getElementById(`user_id_${id}`);
    const datetimeInElement = document.getElementById(`datetime_${id}_in`);
    const datetimeOutElement = document.getElementById(`datetime_${id}_out`);
    const attendanceStatusElement = document.getElementById(`attendance_status_${id}`);
    const attendanceTypeElement = document.getElementById(`attendance_type_${id}`);

    // Then get the values
    const userId = userIdElement.value;
    const datetimeIn = datetimeInElement.value.replace('T', ' ');
    const datetimeOut = datetimeOutElement.value.replace('T', ' ');
    const attendanceStatus = attendanceStatusElement.value;
    const attendanceType = attendanceTypeElement.value;

    // Now you can use the elements in console.log
    console.log('userIdElement:', userIdElement);
    console.log('datetimeInElement:', datetimeInElement);
    console.log('datetimeOutElement:', datetimeOutElement);
    console.log('attendanceStatusElement:', attendanceStatusElement);
    console.log('attendanceTypeElement:', attendanceTypeElement);

    console.log(`Saving record with ID: ${id}, DateTime In: ${datetimeIn}, DateTime Out: ${datetimeOut}, Attendance Status: ${attendanceStatus}, Attendance Type: ${attendanceType}`);

    if (!userId || !attendanceStatus) {
        alert('User ID and attendance_status Status must be filled.');
        return;
    }

    // Determine late status for check-in and check-out
    const isLateIn = isLate(new Date(datetimeIn)) ? 1 : 0;
    const isLateOut = datetimeOut ? (isLate(new Date(datetimeOut)) ? 1 : 0) : 0; // 0 if no check-out

    const formData = new FormData();
    formData.append('id', id);
    formData.append('user_id', userId);
    formData.append('datetime_in', datetimeIn);
    formData.append('datetime_out', datetimeOut);
    formData.append('attendance_status', attendanceStatus);
    formData.append('attendance_type', attendanceType); // Include attendance_type
    formData.append('is_late_in', isLateIn);
    formData.append('is_late_out', isLateOut);

    fetch('../save_record.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(text => {
        if (text === 'success') {
            alert('Record updated successfully');
            fetchRecords(); // Refresh records after saving
        } else {
            alert('Failed to update record. Server response: ' + text); 
        }
    })
    .catch(error => {
        console.error('Error saving record:', error);
        alert('An error occurred while saving the record. Please try again later.'); 
    });
}





function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        fetch('../manage_record.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'delete',
                id: id
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Record deleted successfully');
                fetchRecords(); // Refresh records after deletion
            } else {
                alert('Delete failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}


function deleteRecords(type) {
    if (!confirm('Are you sure you want to delete all records?')) {
        return; // Exit if user cancels the action
    }

    let formData = new FormData();
    formData.append('action', 'delete_all');
    formData.append('type', type);

    fetch('../manage_attendance.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.status === 'success') {
                alert('All records deleted successfully.');
                fetchRecords(); // Refresh records after deletion
            } else {
                alert('Delete failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            console.error('Response text:', text); // Log the raw response
        }
    })
    .catch(error => console.error('Error:', error));
}
