const Influx = require('influx');
const cfg = require('../config/config');
const influx = new Influx.InfluxDB({
  host: cfg.DATABASE_IP,
  port: cfg.DATABASE_PORT,
  database: cfg.DATABASE_NAME
})

function db_cek() {
  return influx.getDatabaseNames()
    .then(names => {
      if (!names.includes(cfg.DATABASE_NAME)) {
        return influx.createDatabase(cfg.DATABASE_NAME);
      }
    })
    .catch(err => {
      console.error(new Date() + "[InfluxDB] Gagal membuat database");
    })
}

//insert_metrics : masukkan metric ke database dengan syarat format data sebagai berikut
//[
// { 
//     ip: ,
//     of_dpid: ,
//     of_port: ,
//     ifinutilization: ,
//     ifoututilization: ,
//     ifinoctets: ,
//     ifoutoctets: ,
//     ifspeed: 
// }, ...
//]
function insert_metrics(data) {
  db_cek().then(() => {
    for (i in data) {
      influx.writePoints([
        {
          measurement: 'throughput',
          tags: {
            dpid: data[i].of_dpid,
            port: data[i].of_port,
            ip: data[i].ip,
            ifspeed: data[i].ifspeed
          },
          fields: {
            ifinutilization: data[i].ifinutilization,
            ifoututilization: data[i].ifoututilization,
            ifinoctets: data[i].ifinoctets,
            ifoutoctets: data[i].ifoutoctets
          },
        }
      ])
    }
  }).catch(err => console.error(new Date() + "[InfluxDB] Gagal memasukkan data ke database"))
}

function get_metrics() {
  return db_cek().then(() => {
    return influx.query('select time,dpid,port,ifinoctets,ifoutoctets,ifspeed,ip,ifinutilization,ifoututilization from throughput')
  }).catch(err => console.error(new Date() + "[InfluxDB] Gagal mengambil data dari database"))
}

module.exports = {
  insert_metrics: insert_metrics,
  get_metrics: get_metrics
}