const axios = require("axios");
const cfg = require('../config/config');
var devices = []
var links = []
var hosts = []

//Method untuk HTTP Request ke ONOS Controller
async function restcon(api, method = "GET") {
    const url = "http://" + cfg.CONTROLLER_IP + ":" + cfg.CONTROLLER_PORT + api;
    const rest = await axios({
        method: method,
        url: url,
        auth: {
            username: cfg.CONTROLLER_USER,
            password: cfg.CONTROLLER_PASS,
        }
    });
    return rest;
}

function get_devices() {
    return restcon("/onos/v1/devices").then((response) => {
        devices = []
        for (d in response.data.devices) {
            var hw = response.data.devices[d].hw + " " + response.data.devices[d].sw
            devices.push({
                id: response.data.devices[d].id,
                hardware: hw,
                protocol: response.data.devices[d].annotations.protocol,
                ip: response.data.devices[d].annotations.managementAddress,
                state: response.data.devices[d].humanReadableLastUpdate
            })
        }
        return devices;
    }).catch(err => console.error(new Date() + "[ONOS] Gagal mengambil data perangkat"))
}

function get_links() {
    return restcon("/onos/v1/links").then((response) => {
        links = []
        for (l in response.data.links) {
            if (!(links.filter(a => (a.from == response.data.links[l].dst.device) && (a.to == response.data.links[l].src.device)).length > 0)) {
                links.push({
                    id: l,
                    from: response.data.links[l].src.device,
                    to: response.data.links[l].dst.device,
                    from_port: response.data.links[l].src.port,
                    to_port: response.data.links[l].dst.port
                });
            }
        }
        return links;
    }).catch(err => console.error(new Date() + "[ONOS] Gagal mengambil data links"))
}

function get_hosts() {
    return restcon("/onos/v1/hosts").then((response) => {
        hosts = []
        for (h in response.data.hosts) {
            hosts.push({
                mac: response.data.hosts[h].mac,
                ip: response.data.hosts[h].ipAddresses,
                to: response.data.hosts[h].locations[0].elementId,
                to_port: response.data.hosts[h].locations[0].port
            })
        }
        return hosts;
    }).catch(err => console.error(new Date() + "[ONOS] Gagal mengambil data host"))
}

module.exports = {
    get_devices: get_devices,
    get_links: get_links,
    get_hosts: get_hosts
}