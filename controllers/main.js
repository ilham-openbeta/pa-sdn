const influx = require("../models/influx")
const onos = require("../models/onos")
const sflow = require("../models/sflow")
const cfg = require("../config/config")
const fs = require("fs")
var io;
var nodes = [];
var nodes_temp = [];
var links_temp = [];
var hosts_temp = [];
var metrics_temp = [];

// Untuk traffic generator
const net = require('net');
var daftar = [];
//daftar alamat telnet client dari GNS3
var t = [{
        host: "192.168.230.128",
        port: 5022
    },
    {
        host: "192.168.230.128",
        port: 5026
    },
    {
        host: "192.168.230.128",
        port: 5030
    },
    {
        host: "192.168.230.128",
        port: 5034
    }
]
//daftar alamat iperf server
var p = [{
        host: "10.10.10.11"
    },
    {
        host: "10.10.10.13"
    },
    {
        host: "10.10.10.15"
    },
    {
        host: "10.10.10.17"
    },
]
async function telnet(host, port, perintah, data) {
    let n = net.connect({
        host: host,
        port: port
    });
    n.
    on('connect', function () {
        console.log('Telnet terhubung dengan : ' + host + ':' + port);
        n.write(perintah, () => {
            daftar[data.asal] = {
                tujuan: data.tujuan,
                throughput: data.throughput,
                tgl: new Date()
            }
            io.sockets.emit("info", daftar);
            n.destroy();
        });
    }).
    on('close', function () {
        console.log('Koneksi tertutup');
        n.destroy();
    }).
    on('error', function (err) {
        console.log(err)
    }).
    on('data', function (data) {
        console.log("Telnet> " + data)
    });
}

function onos_service() {
    setTimeout(() => {
        onos.get_devices().then(res => {
            nodes_temp = res
            io.sockets.emit("nodes", res);
        })
        onos.get_links().then(res => {
            links_temp = res
            io.sockets.emit("links", res);
        })
        onos.get_hosts().then(res => {
            hosts_temp = res
            io.sockets.emit("hosts", res);
        })
        onos_service();
    }, cfg.CONTROLLER_POLLING_INTERVAL)
}

function sflow_service() {
    setTimeout(() => {
        sflow.get_metrics().then(res => {
            metrics_temp = res
            influx.insert_metrics(res)
            io.sockets.emit("metrics", res);
        })
        sflow_service();
    }, cfg.SFLOW_POLLING_INTERVAL)
}

module.exports = async function (params) {
    io = params;
    let rawdata = fs.readFileSync('./controllers/nodes.json');
    nodes = JSON.parse(rawdata);
    // inisialisasi data. komentari 4 baris ke bawah jika controller mati agar dapat
    // menampilkan halaman laporan asalkan database server hidup
    nodes_temp = await onos.get_devices()
    links_temp = await onos.get_links()
    hosts_temp = await onos.get_hosts()
    metrics_temp = await sflow.get_metrics()
    io.on('connection', socket => {
        socket.emit("nodes", nodes_temp)
        socket.emit("links", links_temp)
        socket.emit("hosts", hosts_temp)
        influx.get_metrics().then(res => {
            socket.emit("init", res)
        })
        socket.emit("metrics", metrics_temp)
        socket.emit("load", nodes)

        socket.on("simpan", data => {
            nodes = data
            let jison = JSON.stringify(nodes);
            fs.writeFileSync('./controllers/nodes.json', jison);
            io.sockets.emit("load", nodes);
        })

        // Traffic generator
        socket.on("tg", data => {
            let cmd = "\x03 iperf3 -c " + p[data.tujuan].host + " -b " + (data.throughput * 8) + "K -t 120\r";
            telnet(t[data.asal].host, t[data.asal].port, cmd, data);
        })
        socket.emit("info", daftar)

    });
    onos_service();
    sflow_service();
}