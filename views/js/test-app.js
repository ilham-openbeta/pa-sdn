var socket = io();
var daftar = [];
var server_check = [false, false, false, false];

function format_waktu(tgl) {
    let time = tgl.getHours() + ":" + tgl.getMinutes() + ":" + tgl.getSeconds();
    return time
}

function buat_traffic() {
    let from = parseInt($("#asal").val())
    let to = parseInt($("#tujuan").val())
    let bw = parseInt($("#throughput").val())
    if(isNaN(bw) || bw == 0){
        bw = 100
    }
    if (server_check[to]) {
        let tujuan = [1, 3, 5, 7]
        alert("Server PC-" + tujuan[to] + " sibuk, silahkan pilih PC tujuan yang lainnya")
    } else {
        let data = {
            asal: from,
            tujuan: to,
            throughput: bw
        }
        socket.emit("tg", data)
    }
}

function tampil_info() {
    if (daftar.length > 0) {
        $("#info").html("")
        for (i in daftar) {
            if (!jQuery.isEmptyObject(daftar[i])) {
                let tanggal = new Date(new Date() - 60000)
                if (tanggal <= new Date(daftar[i].tgl)) {
                    server_check[daftar[i].tujuan] = true
                    let asal = [2, 4, 6, 8]
                    let tujuan = [1, 3, 5, 7]
                    let html = "[" + format_waktu(new Date(daftar[i].tgl)) + "] PC-" + asal[i] + " mengirimkan traffic ke PC-" + tujuan[daftar[i].tujuan] +
                        " sebesar " + daftar[i].throughput + " KB/s <br>";
                    $("#info").append(html)
                } else {
                    server_check[daftar[i].tujuan] = false
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