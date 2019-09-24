const influx = require("../models/influx")
const onos = require("../models/onos")
const sflow = require("../models/sflow")
const cfg = require("../config/config")
var io;

function onos_service() {
    setTimeout(() => {
        onos.get_devices().then(res => { io.sockets.emit("nodes", res); }).catch(err => console.log("ONOS Timeout"))
        onos.get_links().then(res => { io.sockets.emit("links", res); }).catch(err => console.log("ONOS Timeout"))
        onos.get_hosts().then(res => { io.sockets.emit("hosts", res); }).catch(err => console.log("ONOS Timeout"))
        onos_service();
    }, cfg.CONTROLLER_POLLING_INTERVAL)
}

function sflow_service() {
    setTimeout(() => {
        sflow.get_metrics().then(res => {
            influx.insert_metrics(res);
            io.sockets.emit("metrics", res);
        }).catch(err => console.log("sFlow Timeout"))
        sflow_service();
    }, cfg.SFLOW_POLLING_INTERVAL)
}

module.exports = function (params) {
    io = params;
    io.on('connection', socket => {
        onos.get_devices().then(res => { socket.emit("nodes", res) }).catch(err => console.log("ONOS Timeout"))
        onos.get_links().then(res => { socket.emit("links", res) }).catch(err => console.log("ONOS Timeout"))
        onos.get_hosts().then(res => { socket.emit("hosts", res) }).catch(err => console.log("ONOS Timeout"))
        influx.get_metrics().then(res => { socket.emit("init", res) }).catch(err => console.log("Influx Timeout"))
    });
    onos_service();
    sflow_service();
}