var socket = io();
var daftar = [];

function format_waktu(tgl) {
    let time = tgl.getHours() + ":" + tgl.getMinutes() + ":" + tgl.getSeconds();
    return time
}

function buat_traffic() {
    let data = {
        asal: parseInt($("#asal").val()),
        tujuan: parseInt($("#tujuan").val()),
        throughput: $("#throughput").val()
    }
    socket.emit("tg", data)
}

function tampil_info() {
    if (daftar.length > 0) {
        $("#info").html("")
        for (i in daftar) {
            if (!jQuery.isEmptyObject(daftar[i])) {
                let tanggal = new Date(new Date() - 60000)
                if (tanggal <= new Date(daftar[i].tgl)) {
                    let asal = [2,4,6,8]
                    let tujuan = [1,3,5,7]
                    let html = "[" + format_waktu(new Date(daftar[i].tgl)) + "] PC-" + asal[i] + " mengirimkan traffic ke PC-" + tujuan[daftar[i].tujuan] +
                        " sebesar " + daftar[i].throughput + " KB/s";
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