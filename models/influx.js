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
      console.error('Gagal membuat database ' + err.stack);
    })
}

//insert_metrics : masukkan metric ke database dengan syarat format data sebagai berikut
//[
// { 
//     of_dpid: ,
//     of_port: ,
//     ifinutilization: ,
//     ifoututilization: ,
//     ifinoctets: ,
//     ifoutoctets:
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
            port: data[i].of_port
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
  })
}

function get_metrics() {
  return db_cek().then(() => {
    return influx.query('select time,dpid,port,ifinoctets,ifoutoctets from throughput')
  })
}

module.exports = {
  insert_metrics: insert_metrics,
  get_metrics: get_metrics
}