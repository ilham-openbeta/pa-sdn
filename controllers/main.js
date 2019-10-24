const influx = require("../models/influx")
const onos = require("../models/onos")
const sflow = require("../models/sflow")
const cfg = require("../config/config")
var io;

// Untuk traffic generator
const net = require('net');
var daftar = [];
//daftar alamat telnet client
var t = [
    // {
    //     host: "192.168.213.128",
    //     port: 5072
    // },
    {
        host: "192.168.213.128",
        port: 5000
    }
]
//daftar alamat iperf server
var p = [
    {
        host: "192.168.111.77"
    },
    {
        host: "192.168.111.78"
    }
]
function telnet(host, port, perintah, data) {
    let n = net.connect({ host: host, port: port });
    n.
        on('connect', function () {
            console.log('Telnet terhubung dengan : ' + host + ':' + port);
            n.write(perintah);
            daftar[data.asal] = { tujuan: data.tujuan, throughput: data.throughput, tgl: new Date() }
            io.sockets.emit("info", daftar);
            n.destroy();
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
        onos.get_devices().then(res => { io.sockets.emit("nodes", res); })
        onos.get_links().then(res => { io.sockets.emit("links", res); })
        onos.get_hosts().then(res => { io.sockets.emit("hosts", res); })
        onos_service();
    }, cfg.CONTROLLER_POLLING_INTERVAL)
}

function sflow_service() {
    setTimeout(() => {
        sflow.get_metrics().then(res => {
            influx.insert_metrics(res)
            io.sockets.emit("metrics", res);
        })
        sflow_service();
    }, cfg.SFLOW_POLLING_INTERVAL)
}

module.exports = function (params) {
    io = params;
    io.on('connection', socket => {
        onos.get_devices().then(res => { socket.emit("nodes", res) })
        onos.get_links().then(res => { socket.emit("links", res) })
        onos.get_hosts().then(res => { socket.emit("hosts", res) })
        influx.get_metrics().then(res => { socket.emit("init", res) })

        // Traffic generator
        socket.on("tg", data => {
            let cmd = "\x03 iperf3 -c " + p[data.tujuan].host + " -b " + (data.throughput * 8) + "K -t 60\r";
            telnet(t[data.asal].host, t[data.asal].port, cmd, data);
        })
        socket.emit("info", daftar)

    });
    onos_service();
    sflow_service();
}