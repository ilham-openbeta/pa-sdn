const axios = require("axios");
const cfg = require('../config/config');
var metrics = [];

//Method untuk HTTP Request ke sFlow-RT
async function restcon(api, method = "GET") {
    const url = "http://" + cfg.SFLOW_IP + ":" + cfg.SFLOW_PORT + api;
    const rest = await axios({
        method: method,
        url: url
    });
    return rest;
}

//get_metrics : Output ke Web Socket dengan nama "metrics" berisi
//[
// { 
//     of_dpid: ,
//     of_port: ,
//     ifinutilization: ,
//     ifoututilization: ,
//     ifinoctets: ,
//     ifoutoctets: ,
//     ifspeed: 
// }, ...
//]
function get_metrics() {
    var metric_keys = "of_dpid,of_port,ifinutilization,ifoututilization,ifinoctets,ifoutoctets,ifspeed"
    return restcon("/table/ALL/" + metric_keys + "/json").then((response) => {
        metrics = []
        for (i in response.data) {
            var temp = {}
            temp["ip"] = response.data[i][0].agent
            for (j in response.data[i]) {
                if (isNaN(response.data[i][j].metricValue)) {
                    temp[response.data[i][j].metricName] = response.data[i][j].metricValue
                } else {
                    temp[response.data[i][j].metricName] = Math.round(response.data[i][j].metricValue)
                }
            }
            //hanya kirimkan data dengan traffic diatas 1000 bytes
            if ((temp.ifinoctets > 1000) || (temp.ifoutoctets > 1000)) {
                metrics.push(temp)
            }
        }
        return metrics;
    });
}

module.exports = {
    get_metrics: get_metrics
}