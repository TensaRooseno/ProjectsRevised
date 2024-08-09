// Inisialisasi flatpickr pada elemen input tanggal
document.addEventListener('DOMContentLoaded', function () {
    flatpickr('.datetimepicker', {
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
    });
});

function fetchUserStatistics() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');

    if (!userId) {
        document.getElementById('user-name').innerHTML = '<p class="text-danger">User ID is missing.</p>';
        return;
    }

    fetch(`../fetch_statistics.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('user-name').innerHTML = `<p class="text-danger">${data.error}</p>`;
            } else {
                document.getElementById('user-name').textContent = `${data.user.full_name}'s User Statistics`;

                const attendance_status = data.attendance_status;
                document.getElementById('totalRecords').textContent = attendance_status.length;
                const presentCount = attendance_status.filter(record => record.attendance_status > 0).length;
                const absentCount = attendance_status.filter(record => record.attendance_status === 0).length;
                const lateCount = attendance_status.filter(record => record.late === 1).length;
                const onTimeCount = attendance_status.length - lateCount;
                document.getElementById('present').textContent = presentCount;
                document.getElementById('absent').textContent = absentCount;
                document.getElementById('late').textContent = lateCount;
                document.getElementById('onTime').textContent = onTimeCount;

                const lateStatistics = `
                    Total Late: ${lateCount}<br>
                    <ul>
                        <li>15-30 minutes late: ${attendance_status.filter(record => record.late === 1 && new Date(record.datetime).getMinutes() >= 15 && new Date(record.datetime).getMinutes() < 30).length}</li>
                        <li>30-60 minutes late: ${attendance_status.filter(record => record.late === 1 && new Date(record.datetime).getMinutes() >= 30 && new Date(record.datetime).getMinutes() < 60).length}</li>
                        <li>More than an hour late: ${attendance_status.filter(record => record.late === 1 && new Date(record.datetime).getMinutes() >= 60).length}</li>
                    </ul>
                `;
                document.getElementById('lateStatistics').innerHTML = lateStatistics;

                const ctx = document.getElementById('attendanceChart').getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Present', 'Absent', 'Late', 'On Time'],
                        datasets: [{
                            data: [presentCount, absentCount, lateCount, onTimeCount],
                            backgroundColor: ['#4CAF50', '#FF5733', '#FFC107', '#2196F3'],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'attendance_status Statistics'
                            }
                        }
                    }
                });

                const dateWiseAttendance = {};
                attendance_status.forEach(record => {
                    const date = new Date(record.datetime);
                    const monthDay = date.toISOString().split('T')[0].substring(5); // Extract month and day
                    if (!dateWiseAttendance[monthDay]) {
                        dateWiseAttendance[monthDay] = { in: [], out: [] };
                    }
                    if (record.attendance_status === 1) {
                        dateWiseAttendance[monthDay].in.push(record);
                    } else {
                        dateWiseAttendance[monthDay].out.push(record);
                    }
                });

                const dateWiseCtx = document.getElementById('dateWiseChart').getContext('2d');
                new Chart(dateWiseCtx, {
                    type: 'line',
                    data: {
                        labels: Object.keys(dateWiseAttendance),
                        datasets: [{
                            label: 'attendance_status Count',
                            data: Object.values(dateWiseAttendance).map(records => records.in.length + records.out.length),
                            borderColor: '#FF5733',
                            backgroundColor: 'rgba(255, 87, 51, 0.2)',
                            borderWidth: 1,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Date Wise attendance_status'
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Date'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Count'
                                },
                                beginAtZero: true
                            }
                        }
                    }
                });

                // Update the attendance_status table
                document.getElementById('attendance_status-table-body').innerHTML = Object.keys(dateWiseAttendance).map((monthDay, index) => {
                    const records = dateWiseAttendance[monthDay];
                    const firstRecordIn = records.in[0] || {};
                    const firstRecordOut = records.out[0] || {};
                    const userId = firstRecordIn.user_id || firstRecordOut.user_id || '';
                    const fullName = data.user.full_name;
                    const datetimeIn = records.in.length > 0 ? moment(records.in[0].datetime).format('YYYY-MM-DDTHH:mm') : '';
                    const datetimeOut = records.out.length > 0 ? moment(records.out[0].datetime).format('YYYY-MM-DDTHH:mm') : '';

                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td><input type="text" value="${userId}" class="form-control" readonly></td>
                            <td>${fullName}</td>
                            <td><input type="datetime-local" value="${datetimeIn}" class="form-control datetimepicker"></td>
                            <td>Check In</td>
                            <td>
                                <select class="form-control">
                                    <option value="0" ${records.in.length > 0 && records.in[0].attendance_status === 0 ? 'selected' : ''}>-</option>
                                    <option value="1" ${records.in.length > 0 && records.in[0].attendance_status === 1 ? 'selected' : ''}>Hadir</option>
                                    <option value="2" ${records.in.length > 0 && records.in[0].attendance_status === 2 ? 'selected' : ''}>Izin</option>
                                    <option value="3" ${records.in.length > 0 && records.in[0].attendance_status === 3 ? 'selected' : ''}>Sakit</option>
                                    <option value="4" ${records.in.length > 0 && records.in[0].attendance_status === 4 ? 'selected' : ''}>Alfa</option>
                                </select>
                            </td>
                            <td>${records.in.length > 0 ? (records.in[0].late === 1 ? 'Late' : 'On Time') : '-'}</td>
                            <td>
                                <button onclick="saveRecord(${firstRecordIn.id}, 'in', event)" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Save Change
                                </button>
                                <button onclick="deleteRecord(${firstRecordIn.id})" class="btn btn-danger">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td></td>
                            <td><input type="text" value="${userId}" class="form-control" readonly></td>
                            <td>${fullName}</td>
                            <td><input type="datetime-local" value="${datetimeOut}" class="form-control datetimepicker"></td>
                            <td>Check Out</td>
                            <td>
                                <select class="form-control">
                                    <option value="0" ${records.out.length > 0 && records.out[0].attendance_status === 0 ? 'selected' : ''}>-</option>
                                    <option value="1" ${records.out.length > 0 && records.out[0].attendance_status === 1 ? 'selected' : ''}>Hadir</option>
                                    <option value="2" ${records.out.length > 0 && records.out[0].attendance_status === 2 ? 'selected' : ''}>Izin</option>
                                    <option value="3" ${records.out.length > 0 && records.out[0].attendance_status === 3 ? 'selected' : ''}>Sakit</option>
                                    <option value="4" ${records.out.length > 0 && records.out[0].attendance_status === 4 ? 'selected' : ''}>Alfa</option>
                                </select>
                            </td>
                            <td>${records.out.length > 0 ? (records.out[0].late === 1 ? 'Late' : 'On Time') : '-'}</td>
                            <td>
                                <button onclick="saveRecord(${firstRecordOut.id}, 'out', event)" class="btn btn-primary">
                                    <i class="fas fa-save"></i> Save Change
                                </button>
                                <button onclick="deleteRecord(${firstRecordOut.id})" class="btn btn-danger">
                                    <i class="fas fa-trash-alt"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                flatpickr('.datetimepicker', {
                    enableTime: true,
                    dateFormat: 'Y-m-dTH:i',
                });

            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Panggil fetchUserStatistics saat halaman dimuat
document.addEventListener('DOMContentLoaded', fetchUserStatistics);

// Function to save record
function saveRecord(id, type, event) {
    const row = $(event.target).closest('tr');
    const userId = row.find('input').eq(0).val();
    const datetime = row.find('input').eq(1).val().replace('T', ' ');
    const attendance_status = row.find('select').val();

    console.log(`Saving record with ID: ${id}, Type: ${type}, DateTime: ${datetime}, attendance_status: ${attendance_status}`);

    if (!userId || !datetime || attendance_status === undefined) {
        alert('All fields must be filled.');
        return;
    }

    const formData = new FormData();
    formData.append('id', id);
    formData.append('user_id', userId);
    formData.append('datetime', datetime);
    formData.append('attendance_status', attendance_status);
    formData.append('action', 'save');
    formData.append('type', type);

    fetch('../user_record.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert('Record saved successfully.');
            fetchUserStatistics(); // Refresh the statistics after saving
        } else {
            alert('Failed to save record: ' + result.message);
        }
    })
    .catch(error => console.error('Error saving record:', error));
}

// Function to delete record
function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        fetch('../user_record.php', {
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
        .then(result => {
            if (result.status === 'success') {
                alert('Record deleted successfully.');
                fetchUserStatistics(); // Refresh the statistics after deletion
            } else {
                alert('Failed to delete record: ' + result.message);
            }
        })
        .catch(error => console.error('Error deleting record:', error));
    }
}

