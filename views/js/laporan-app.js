var database = [];
var devices = [];
var socket = io();
var g = [];
var val = [];

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

function format_waktu(tgl) {
    let time = tgl.getHours() + ":" + tgl.getMinutes() + ":" + tgl.getSeconds();
    return time
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
                from.setHours(from.getHours() - 24)
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
            let c = 0;
            html =
                '<br>Laporan statistik throughput dari ' + format_tgl(from) + ' hingga ' + format_tgl(to) +
                '<br>Keterangan : tidak menampilkan perangkat dan port yang tidak memiliki data' +
                '<br>'
            baris.append(html)
            
            //buat devices dari database jika websocket onos mati
            if(devices.length == 0){
                let list_dev = [...new Set(filter_tgl.map(a => a.dpid))]
                for(dd of list_dev){
                    devices.push({id: "of:" + dd})
                }
            } 

            for (i in devices) {
                //filter salah satu data perangkat
                let filter_dev = filter_tgl.filter(a => (("of:" + a.dpid) == devices[i].id))
                if (filter_dev.length != 0) {
                    html =
                        '<hr><br> <b>Perangkat : of:' + filter_dev[0].dpid +
                        '<br> IP Address : ' + filter_dev[0].ip + '</b>'
                        // '<br> Link Speed : ' + filter_dev[0].ifspeed / 1000000 + ' Mbps'
                    baris.append(html)
                    //list port yang ada di database
                    let list_port = [...new Set(filter_dev.map(a => a.port))]
                    for (j in list_port) {
                        let filter_port = filter_dev.filter(a => a.port == list_port[j])
                        //IN - THROUGHPUT
                        let max_in = Math.max(...filter_port.map(a => a.ifinoctets))
                        let sum_in = filter_port.reduce((total, val) => {
                            return total + val.ifinoctets
                        }, 0)
                        let avg_in = sum_in / filter_port.length
                        //IN - UTILIZATION
                        let max_util_in = Math.max(...filter_port.map(a => a.ifinutilization))
                        let sum_util_in = filter_port.reduce((total, val) => {
                            return total + val.ifinutilization
                        }, 0)
                        let avg_util_in = sum_util_in / filter_port.length

                        //OUT - THROUGHPUT
                        let max_out = Math.max(...filter_port.map(a => a.ifoutoctets))
                        let sum_out = filter_port.reduce((total, val) => {
                            return total + val.ifoutoctets
                        }, 0)
                        let avg_out = sum_out / filter_port.length
                        //OUT - UTILIZATION
                        let max_util_out = Math.max(...filter_port.map(a => a.ifoututilization))
                        let sum_util_out = filter_port.reduce((total, val) => {
                            return total + val.ifoututilization
                        }, 0)
                        let avg_util_out = sum_util_out / filter_port.length

                        //cari tanggal max
                        let max_in_data = filter_port.find(a => a.ifinoctets == max_in)
                        let max_out_data = filter_port.find(a => a.ifoutoctets == max_out)
                        let max_in_time = new Date(max_in_data.time)
                        let max_out_time = new Date(max_out_data.time)

                        html =
                            '<div class="grafik"></div>' +
                            '<table style="margin: 20px 80px">' +
                            '<tr>' +
                            '<td><span style="color:#00ff00">Inbound</span></td>' +
                            '<td style="width: 360px">Max: ' + Math.round(max_in / 1000) + ' KB/s' +
                            ' (' + format_tgl(max_in_time) + " " +
                            format_waktu(max_in_time) + ')</td>' +
                            '<td style="width: 160px">Avg: ' + Math.round(avg_in / 1000) + ' KB/s</td>' +
                            '<td style="width: 200px">Total Bytes: ' + Math.round(sum_in / 1000000) + ' MB</td>' +
                            '</tr>' +
                            '<tr>' +
                            '<td><span style="color:#0000ff">Outbound</span></td>' +
                            '<td>Max: ' + Math.round(max_out / 1000) + ' KB/s' +
                            ' (' + format_tgl(max_out_time) + " " +
                            format_waktu(max_out_time) + ')</td>' +
                            '<td>Avg: ' + Math.round(avg_out / 1000) + ' KB/s</td>' +
                            '<td>Total Bytes: ' + Math.round(sum_out / 1000000) + ' MB</td>' +
                            '</tr>' +
                            '</table>'
                        baris.append(html)

                        //buat grafik
                        val[c] = []
                        for (q in filter_port) {
                            val[c].push([new Date(filter_port[q].time), Math.round(filter_port[q].ifinoctets / 1000), Math.round(filter_port[q].ifoutoctets / 1000)])
                        }
                        let container = $(".grafik")[c];
                        g[c] = new Dygraph(container, val[c], {
                            title: "of:" + filter_dev[0].dpid + " port " + list_port[j],
                            drawPoints: true,
                            labels: ['Tanggal', 'IN', 'OUT'],
                            ylabel: "Throughput (KB/s)",
                            xlabel: "Waktu",
                            strokeWidth: 2,
                            colors: ["#00ff00", "#0000ff"]
                        });
                        c++;
                    }
                } else {
                    console.log("Data perangkat " + devices[i].id + " kosong")
                }
            }
            html =
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
            let html = ""
            $("span#3").text(data.length)
            html =
                '<br>Tabel Link' +
                '<br>' +
                '<table>' +
                '<tr>' +
                '    <th colspan="2">Dari</th>' +
                '    <th rowspan="2"></th>' +
                '    <th colspan="2">Ke</th>' +
                '</tr>' +
                '<tr>' +
                '    <th>DPID</th>' +
                '    <th>Port</th>' +
                '    <th>DPID</th>' +
                '    <th>Port</th>' +
                '</tr>'
            for (d in data) {
                html +=
                    '<tr>' +
                    '    <td>' + data[d].from + '</td>' +
                    '    <td>' + data[d].from_port + '</td>' +
                    '    <td>&lt;&gt;</td>' +
                    '    <td>' + data[d].to + '</td>' +
                    '    <td>' + data[d].to_port + '</td>' +
                    '</tr>'
            }
            html += '</table>'
            $(".daftar-link").html(html)
        }
    })

    socket.on("hosts", function (data) {
        if (data) {
            $("span#2").text(data.length)
        }
    })
})