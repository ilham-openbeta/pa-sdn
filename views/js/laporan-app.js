var database = [];
var devices = [];

// try & generate view

function buat_tabel() {
    if (database.length == 0) {
        console.log("Database kosong")
    } else {
        let baris = $('.daftar-sw')
        let from = $('input[name="dari"]').val()
        let to = $('input[name="ke"]').val()
        console.log("from: " + from)
        console.log("to: " + to)
        console.log("contoh waktu: " + database[0].time)
        //filter tanggal yang sesuai
        let filter_tgl = database.filter(a => (a.time >= from) && (a.time <= to))
        if (filter_tgl.length != 0) {
            for (i in devices) {
                //filter salah satu data perangkat
                let filter_dev = filter_tgl.filter(a => (("of:" + a.dpid) == devices[i].id))
                console.log("DPID: " + devices[i].id)
                console.log("IP Address: " + devices[i].ip)
                console.log("Link Speed: " + devices[i].ifspeed)
                //list port yang ada di database
                let list_port = [...new Set(filter_dev.map(a => a.port))]
                console.log("List port: " + JSON.stringify(list_port))
                for (i in list_port) {
                    let filter_port = filter_dev.filter(a => a.port == list_port[i])
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

                    console.log("port: " + filter_port[i])
                    console.log("max: " + max)
                    console.log("min: " + min)
                    console.log("avg: " + avg)
                    console.log("sum: " + sum)
                    
                    console.log("max_util: " + max_util)
                    console.log("min_util: " + min_util)
                    console.log("avg_util: " + avg_util)
                }
            }
        } else {
            console.log("tidak ada data sesuai tanggal " + from + " hingga " + to)
        }

    }
}

$(function () {

    socket.on("init", function (data) {
        database = data;
    })

    socket.on("nodes", function (data) {
        devices = data;
        console.log("Jumlah switch: " + data.length)
    })

    socket.on("links", function (data) {
        console.log("Jumlah link: " + data.length)
    })

    socket.on("hosts", function (data) {
        console.log("Jumlah host: " + data.length)
    })
})