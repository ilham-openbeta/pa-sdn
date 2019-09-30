const influx = require("../models/influx")
const onos = require("../models/onos")
const sflow = require("../models/sflow")
const cfg = require("../config/config")
var io;

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
    });
    onos_service();
    sflow_service();
}