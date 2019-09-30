var database = [];
var devices = [];
var socket = io();

Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});

function format_tgl(date) {
    var monthNames = [
        "Januari", "Februari", "Maret",
        "April", "Mei", "Juni", "Juli",
        "Agustus", "September", "Oktober",
        "November", "Desember"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

// try & generate view
function buat_tabel() {
    let baris = $('.daftar-sw')
    baris.empty()
    if (database.length == 0) {
        console.log("Database kosong")
    } else {
        let from;
        let to;
        let html = "";
        let pilih = $('input[name="periode"]:checked').val()
        // atur periode
        if (pilih == "b") {
            from = new Date($('input[name="dari"]').val())
            to = new Date($('input[name="ke"]').val())
        } else {
            let per = $('select#per').val()
            if (per == "1") {
                from = new Date()
                to = new Date()
            } else if (per == "2") {
                from = new Date()
                from.setDate(from.getDate() - 7)
                to = new Date()
            } else if (per == "3") {
                from = new Date()
                from.setMonth(from.getMonth() - 1)
                to = new Date()
            } else {
                from = new Date()
                from.setFullYear(from.getFullYear() - 1)
                to = new Date()
            }
        }
        //filter tanggal yang sesuai
        let filter_tgl = database.filter(a => (new Date(a.time) >= from) && (new Date(a.time) <= to))
        if (filter_tgl.length != 0) {
            html += '<br>Tabel Statistik Throughput dari ' + format_tgl(from) + ' hingga ' + format_tgl(to) + '<br>'
            for (i in devices) {
                //filter salah satu data perangkat
                let filter_dev = filter_tgl.filter(a => (("of:" + a.dpid) == devices[i].id))
                if (filter_dev.length != 0) {
                    html +=
                        '<br> DPID : of:' + filter_dev[0].dpid +
                        '<br> IP Address : ' + filter_dev[0].ip +
                        '<br> Link Speed : ' + filter_dev[0].ifspeed / 1000000 + ' Mbps' +
                        '<table>' +
                        '<tr>' +
                        '    <th rowspan="2">Port</th>' +
                        '    <th colspan="3">Throughput (KB/s) / Utilization (%)</th>' +
                        '    <th rowspan="2">Total Bytes</th>' +
                        '</tr>' +
                        '<tr>' +
                        '    <th>Max</th>' +
                        '    <th>Min</th>' +
                        '    <th>Avg</th>' +
                        '</tr>'
                    //list port yang ada di database
                    let list_port = [...new Set(filter_dev.map(a => a.port))]
                    for (j in list_port) {
                        let filter_port = filter_dev.filter(a => a.port == list_port[j])
                        let max = Math.max(...filter_port.map(a => a.ifinoctets + a.ifoutoctets))
                        let min = Math.min(...filter_port.map(a => a.ifinoctets + a.ifoutoctets))
                        let sum = filter_port.reduce((total, val) => {
                            let tr = val.ifinoctets + val.ifoutoctets
                            return total + tr
                        }, 0)
                        let avg = sum / filter_port.length

                        let max_util = Math.max(...filter_port.map(a => a.ifinutilization + a.ifoututilization))
                        let min_util = Math.min(...filter_port.map(a => a.ifinutilization + a.ifoututilization))
                        let sum_util = filter_port.reduce((total, val) => {
                            let tr = val.ifinutilization + val.ifoututilization
                            return total + tr
                        }, 0)
                        let avg_util = sum_util / filter_port.length
                        html +=
                            '<tr>' +
                            '    <td>' + filter_port[j].port + '</td>' +
                            '    <td>' + Math.round(max / 1000) + ' (' + Math.round(max_util) + '%)</td>' +
                            '    <td>' + Math.round(min / 1000) + ' (' + Math.round(min_util) + '%)</td>' +
                            '    <td>' + Math.round(avg / 1000) + ' (' + Math.round(avg_util) + '%)</td>' +
                            '    <td>' + Math.round(sum / 1000000) + ' MB</td>' +
                            '</tr>'
                    }
                    html += '</table>'
                } else {
                    console.log("Data perangkat " + devices[i].id + " kosong")
                }
            }
            html +=
                '<br>' +
                'Keterangan : Tidak menampilkan perangkat dan port yang tidak ada datanya' +
                '<div class="no-print">' +
                '<button type="button" class="btn btn-primary" onclick="window.print()">Cetak Laporan</button>' +
                '</div>'
            baris.append(html)
        } else {
            html = "Tidak ada data sesuai tanggal " + format_tgl(from) + " hingga " + format_tgl(to)
            baris.append(html)
        }
    }
}

$(function () {
    $('input[name="dari"]').val(new Date().toDateInputValue());
    $('input[name="ke"]').val(new Date().toDateInputValue());

    socket.on("init", function (data) {
        if (data) {
            database = data;
        }
    })

    socket.on("nodes", function (data) {
        if (data) {
            devices = data;
            $("span#1").text(data.length)
        }
    })

    socket.on("links", function (data) {
        if (data) {
            $("span#3").text(data.length)
        }
    })

    socket.on("hosts", function (data) {
        if (data) {
            $("span#2").text(data.length)
        }
    })
})