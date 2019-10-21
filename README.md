# Sistem Pemantauan Throughput SDN
Sistem pemantauan SDN ini merupakan aplikasi web yang dapat digunakan untuk memantau throughput pada SDN dengan memanfaatkan API ONOS (SDN Controller) dan sFlow-RT (sFlow Collector).

Fitur :
- Visualisasi topologi jaringan secara realtime
- Grafik perangkat realtime
- Membuat laporan throughput setiap perangkat sesuai periode yang ditentukan
- Data throughput tersimpan dalam database

Screenshot
[![teks gambar](url)](url)

Syarat kebutuhan aplikasi :
- ONOS
- sFlow-RT
- Node.js
- InfluxDB

## Cara Install :
### Install Node.js
Lihat [Install Node.js](https://github.com/nodesource/distributions/blob/master/README.md).

### Install InfluxDB
Lihat [Install InfluxDB](https://docs.influxdata.com/influxdb/v1.7/introduction/installation/).

### Download Aplikasi
Clone repository ini kemudian install dependensi npm.
```sh
$ git clone https://github.com/ilham-openbeta/pa-sdn.git
$ cd pa-sdn
$ npm install
```

### Konfigurasi Aplikasi
Konfigurasi aplikasi atur pada file `/config/config.js` yang berisi terkait pengaturan akses ke ONOS, sFlow-RT, dan InfluxDB. Untuk pengaturan port yang digunakan oleh aplikasi web ini terdapat pada `index.js`.

### Jalankan aplikasi
Jalankan aplikasi dengan perintah berikut.
```sh
$ sudo npm run start
```
