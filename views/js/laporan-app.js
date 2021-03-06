var database = [];
var devices = [];
var socket = io();
var g = [];
var val = [];
var nodes = [];
var links = [];

function excel() {
    let createXLSLFormatObj = [];
    // nama file
    let filename = "Data Laporan SDN.xlsx";
    // nama worksheet
    let ws_name = "Data";
    // header kolom
    let xlsHeader = ["Time",
        "OpenFlow ID",
        "OpenFlow Port",
        "IP Address",
        "Inbound Throughput (byte/s)",
        "Outbound Throughput (byte/s)",
        "Inbound Utilization (%)",
        "Outbound Utilization (%)"
    ];
    // json data
    let xlsRows = database

    // ubah header+row dari json ke array
    createXLSLFormatObj.push(xlsHeader);
    $.each(xlsRows, function (index, value) {
        var innerRowData = [];
        $.each(value, function (ind, val) {
            innerRowData.push(val);
        });
        createXLSLFormatObj.push(innerRowData);
    });

    // buat workbook dan worksheet
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);

    // tambah worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, ws_name);

    // download workbook
    XLSX.writeFile(wb, filename);
}

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
    $('.btn1,.btn2').toggle();
    let from;
    let to;
    let pilih = $('input[name="periode"]:checked').val()
    // atur periode
    if (pilih == "b") {
        from = new Date($('input[name="dari"]').val())
        to = new Date($('input[name="ke"]').val())
    } else {
        let per = $('select#per').val()
        from = new Date()
        to = new Date()
        if (per == "1") {
            from.setMinutes(from.getMinutes() - 15)
        } else if (per == "2") {
            from.setMinutes(from.getMinutes() - 30)
        } else if (per == "3") {
            from.setHours(from.getHours() - 1)
        } else if (per == "4") {
            from.setHours(from.getHours() - 6)
        } else if (per == "5") {
            from.setHours(from.getHours() - 12)
        } else if (per == "6") {
            from.setDate(from.getDate() - 1)
        } else if (per == "7") {
            from.setDate(from.getDate() - 7)
        } else if (per == "8") {
            from.setMonth(from.getMonth() - 1)
        } else if (per == "9") {
            from.setMonth(from.getMonth() - 6)
        } else {
            from.setFullYear(from.getFullYear() - 1)
        }
    }

    // ambil data
    $.ajax({
            method: "GET",
            url: "tabel",
            data: {
                start: from.getTime(),
                end: to.getTime()
            }
        })
        .done(function (data) {
            if (data.length == 0) {
                alert("Database tidak terhubung atau kosong. \nSilahkan cek Web Server!")
            } else {
                database = data;
                buat_lap(from,to)
            }
        });
}

function buat_lap(from, to) {
    let baris = $('.daftar-sw')
    baris.empty()
    let html = "";

    //filter tanggal yang sesuai
    let filter_tgl = database.filter(a => (new Date(a.time) >= from) && (new Date(a.time) <= to))
    if (filter_tgl.length != 0) {
        let c = 0;
        html =
            '<div class="no-print">' +
            '<button type="button" class="btn btn-info" onclick="window.print()"><span class="fa fa-print"></span> Cetak Laporan</button>   ' +
            '<button type="button" class="btn btn-success" onclick="excel()"><span class="fa fa-file-alt"></span> Ekspor data ke file</button>' +
            '<hr></div>' +
            '<br>Laporan statistik throughput dari tanggal ' + format_tgl(from) + ' pukul ' + format_waktu(from) +
            ' hingga tanggal ' + format_tgl(to) + ' pukul ' + format_waktu(to) +
            '<br>Keterangan : tidak menampilkan perangkat dan port yang tidak memiliki data' +
            '<br>'
        baris.append(html)

        //buat devices dari database jika websocket onos mati
        if (devices.length == 0) {
            let list_dev = [...new Set(filter_tgl.map(a => a.dpid))]
            for (dd of list_dev) {
                devices.push({
                    id: "of:" + dd
                })
            }
        }

        for (i in devices) {
            //filter salah satu data perangkat
            let filter_dev = filter_tgl.filter(a => (("of:" + a.dpid) == devices[i].id))
            if (filter_dev.length != 0) {
                let label = filter_dev[0].dpid
                if (nodes.length > 0) {
                    let f = nodes.find(a => a.id == ("of:" + filter_dev[0].dpid))
                    if (typeof (f) != "undefined" && typeof (f.label) != "undefined") {
                        label = f.label
                    }
                }
                html =
                    '<hr><br> <b>Nama Perangkat : ' + label +
                    '<br> DPID : of:' + filter_dev[0].dpid +
                    '<br> IP Address : ' + filter_dev[0].ip + '</b>'
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
                        title: label + " port " + list_port[j],
                        drawPoints: true,
                        labels: ['Tanggal', 'IN', 'OUT'],
                        ylabel: "Throughput (KB/s)",
                        xlabel: "Waktu",
                        strokeWidth: 2,
                        colors: ["#00ff00", "#0000ff"],
                        dateWindow: [from, to]
                    });
                    c++;
                }
            } else {
                console.log("Data perangkat " + devices[i].id + " kosong")
            }
        }
    } else {
        html = "Tidak ada data sesuai tanggal " + format_tgl(from) + " hingga " + format_tgl(to)
        baris.append(html)
    }
    $('.btn1,.btn2').toggle();
    document.getElementsByClassName("daftar-sw")[0].scrollIntoView({
        behavior: "smooth"
    });
}

$(function () {
    $('input[name="dari"]').val(new Date().toDateInputValue());
    $('input[name="ke"]').val(new Date().toDateInputValue());

    // socket.on("init", function (data) {
    //     if (data) {
    //         database = data;
    //     }
    // })

    socket.on("nodes", function (data) {
        if (data) {
            devices = data;
            $("span#1").text(data.length)
        }
    })

    socket.on("links", function (data) {
        links = data
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
                '    <th>Nama Perangkat</th>' +
                '    <th>Port</th>' +
                '    <th>Nama Perangkat</th>' +
                '    <th>Port</th>' +
                '</tr>'
            for (d in data) {
                let labelfrom = data[d].from;
                let labelto = data[d].to;
                if (nodes.length > 0) {
                    let f = nodes.find(a => a.id == data[d].from)
                    let t = nodes.find(a => a.id == data[d].to)
                    if (typeof (f) != "undefined" && typeof (f.label) != "undefined") {
                        labelfrom = f.label
                    }
                    if (typeof (t) != "undefined" && typeof (t.label) != "undefined") {
                        labelto = t.label
                    }
                }
                html +=
                    '<tr>' +
                    '    <td>' + labelfrom + '</td>' +
                    '    <td>' + data[d].from_port + '</td>' +
                    '    <td>&lt;&gt;</td>' +
                    '    <td>' + labelto + '</td>' +
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

    socket.on("load", function (data) {
        if (data) {
            nodes = data
        }
        if (links.length > 0) {
            let html = ""
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
                '    <th>Nama Perangkat</th>' +
                '    <th>Port</th>' +
                '    <th>Nama Perangkat</th>' +
                '    <th>Port</th>' +
                '</tr>'
            for (d in links) {
                let labelfrom = links[d].from;
                let labelto = links[d].to;
                if (nodes.length > 0) {
                    let f = nodes.find(a => a.id == links[d].from)
                    let t = nodes.find(a => a.id == links[d].to)
                    if (typeof (f) != "undefined" && typeof (f.label) != "undefined") {
                        labelfrom = f.label
                    }
                    if (typeof (t) != "undefined" && typeof (t.label) != "undefined") {
                        labelto = t.label
                    }
                }
                html +=
                    '<tr>' +
                    '    <td>' + labelfrom + '</td>' +
                    '    <td>' + links[d].from_port + '</td>' +
                    '    <td>&lt;&gt;</td>' +
                    '    <td>' + labelto + '</td>' +
                    '    <td>' + links[d].to_port + '</td>' +
                    '</tr>'
            }
            html += '</table>'
            $(".daftar-link").html(html)
        }
    })
})