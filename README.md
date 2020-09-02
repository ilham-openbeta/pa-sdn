# Sistem Pemantauan Throughput SDN
Sistem pemantauan SDN ini merupakan aplikasi web yang dapat digunakan untuk memantau throughput pada SDN dengan memanfaatkan API ONOS (SDN Controller) dan sFlow-RT (sFlow Collector). Cara membuat SDN bisa dilihat di [blog saya](https://rearm.blogspot.com/).

Fitur :
- Visualisasi topologi jaringan secara realtime
- Grafik perangkat realtime
- Membuat laporan throughput setiap perangkat sesuai periode yang ditentukan
- Data throughput tersimpan dalam database

## Screenshot
### Menu Topologi
[![topologi](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/topo%20app.png)](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/topo%20app.png)

### Menu Grafik :
[![grafik](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/grafik%20app.png)](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/grafik%20app.png)

### Menu Laporan :
[![laporan 1](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/lapor%201.png)](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/lapor%201.png)

[![laporan 2](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/lapor%202.png)](https://github.com/ilham-openbeta/pa-sdn/raw/master/screenshot/lapor%202.png)

## Cara Install :

Syarat kebutuhan aplikasi :
- ONOS (Saya menggunakan versi 2.1.0)
- sFlow-RT (Saya menggunakan versi 3.0)
- Node.js (Saya menggunakan versi 13.2.0)
- InfluxDB (Saya menggunakan versi 1.7.9)

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
Konfigurasi aplikasi terletak pada file `/config/config.js` yang berisi pengaturan terkait akses ke ONOS, sFlow-RT, dan InfluxDB. Untuk pengaturan port yang digunakan oleh aplikasi web dapat diatur pada file `index.js`.

### Jalankan aplikasi
Jalankan aplikasi dengan perintah berikut.
```sh
$ sudo npm run start
```

## TODO
- Optimasi web socket ONOS
Cek perbedaan jumlah data sebelum dikirim ke client. Saat ini perbedaan dicek ketika data sampai di client. Seharusnya data yg dikirim hanya perangkat yang berubah saja, bukan data semua perangkat dikirim.

- Error notification
Memberi notifikasi ke client jika ada hubungan akses ke controller, collector, atau DB yang terputus.

- Per Device connection notification
Prinsip kerjanya kurang lebih sama seperti error notification, tetapi untuk mengawasi perubahan status hubungan perangkat switch.

- Mengolah data flow
Saat ini data yang diolah hanya data metrik.

- Ubah logika sisi client jika terjadi perubahan jumlah perangkat
saat ini :
hapus semua kemudian buat ulang
solusi :
pisah kode untuk initialisasi dan perubahan perangkat
cari yang tambah atau kurang dengan
loop data onos, cek id perangkat apakah ada atau tidak, 
jika tidak, tambahkan perangkat yang tidak ada
loop data variabel, cek id perangkat apakah ada atau tidak, 
jika tidak, hapus perangkat yang tidak ada

- Sinkronisasi data client server
Saat ini jika websocket mati maka akan ada gap/kekosongan data jika halaman tidak direload.

- Database call dibuat REST API nya.

## Lisensi
Jika tidak ada tulisan lisensi pada file source code berarti lisensinya MIT (bebas digunakan), tapi lebih baik kalian memberi tahu saya jika mengembangkan aplikasi ini :)
