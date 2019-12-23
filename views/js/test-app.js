var socket = io();
var daftar = [];

function format_waktu(tgl) {
    let time = tgl.getHours() + ":" + tgl.getMinutes() + ":" + tgl.getSeconds();
    return time
}

function buat_traffic() {
    let from = parseInt($("#asal").val())
    let to = parseInt($("#tujuan").val())
    let bw = parseInt($("#throughput").val())
    if (isNaN(bw) || bw == 0 || bw > 5000) {
        bw = 5000
    }
    let data = {
        asal: from,
        tujuan: to,
        throughput: bw
    }
    if (daftar.length > 0) {
        let tanggal = new Date(new Date() - 120000)
        let me = daftar.find(a => (a.tujuan == to && tanggal <= new Date(a.tgl)))
        if (me) {
            let tujuan = [1, 3, 5, 7]
            alert("Server PC-" + tujuan[to] + " sibuk, silahkan pilih PC tujuan yang lainnya")
        } else {
            socket.emit("tg", data)
        }
    } else {
        socket.emit("tg", data)
    }
}

function tampil_info() {
    if (daftar.length > 0) {
        $("#info").html("")
        for (i in daftar) {
            if (!jQuery.isEmptyObject(daftar[i])) {
                let tanggal = new Date(new Date() - 120000)
                if (tanggal <= new Date(daftar[i].tgl)) {
                    let asal = [2, 4, 6, 8]
                    let tujuan = [1, 3, 5, 7]
                    let html = "[" + format_waktu(new Date(daftar[i].tgl)) + "] PC-" + asal[i] + " mengirimkan traffic ke PC-" + tujuan[daftar[i].tujuan] +
                        " sebesar " + daftar[i].throughput + " KB/s <br>";
                    $("#info").append(html)
                } 
            }
        }
    }
}

$(function () {
    socket.on("info", data => {
        daftar = data;
        tampil_info();
    })

    //cek data setiap detik
    setInterval(tampil_info, 1000);

})