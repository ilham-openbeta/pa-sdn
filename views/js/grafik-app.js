var g = [];
var val = [];
var interfaces = [];
var socket = io();
var len = 0;
var database = [];

//buat fungsi ubah url & get url berdasar selection
function set_dpid(params) {
  let url = new URL(window.location.href);
  url.searchParams.set('dpid', params);
  window.location.assign(url)
}

$(function () {
  //filter data berdasar perangkat, hasil list interfaces
  function get_int() {
    let int;
    let url = new URL(window.location.href);
    let id = url.searchParams.get("dpid");
    if (id) {
      int = interfaces.filter(a => a.dpid == id)
    } else {
      int = interfaces.filter(a => a.dpid == interfaces[0].dpid)
    }
    return int
  }

  //ambil data metrik dari influx
  socket.on("init", function (data) {
    if (data) {
      setTimeout(() => {
        let int = get_int()
        for (i in int) {
          let z = int[i].id
          let metric = data.filter(a => (("of:" + a.dpid) == int[i].dpid) && (a.port == int[i].port))
          if (metric.length != 0) {
            val[z] = []
            metric.forEach(d => {
              val[z].push([new Date(d.time), Math.round(d.ifinoctets / 1000), Math.round(d.ifoutoctets / 1000)]);
            })
          }
          g[z].updateOptions({ 'file': val[z] });
        }
      }, 1000)
    }
  })

  function grafik() {
    //buat opsi pilihan perangkat
    let dpid = interfaces.reduce(function (res, int) {
      if (!res.includes(int.dpid)) {
        res.push(int.dpid)
      }
      return res;
    }, [])
    $('.perangkat option').remove();
    for (d in dpid) {
      let opsi = "<option value=" + dpid[d] + ">" + dpid[d] + "</option>"
      $('.perangkat').append(opsi);
    }

    //buat grafik
    $(".grafik").remove();
    $(".empty-space").remove();
    let int = get_int()
    $('.perangkat option[value="' + int[0].dpid + '"]').attr('selected', 'selected');
    for (i in int) {
      let z = int[i].id
      //set data awal grafik jika kosong
      if (val[z] === undefined) {
        val[z] = []
      }
      if (val[z].length == 0) {
        val[z].push([new Date(), 0, 0]);
      }

      //buat grafik
      let html = "<div class='grafik'></div><div class='empty-space'></div>"
      $('.container').append(html);
      let container = $(".grafik")[i];
      g[z] = new Dygraph(container, val[z], {
        title: int[i].dpid + " port " + int[i].port,
        drawPoints: true,
        labels: ['Tanggal', 'IN', 'OUT'],
        ylabel: "Throughput (KB/s)",
        xlabel: "Waktu"
      });
    }
  }

  //ambil daftar interfaces dari link antar switch
  socket.on("links", function (data) {
    if (data) {
      let cmp = len;
      //simpan ke daftar interfaces
      for (i in data) {
        if (!interfaces.some(a => ((a.dpid == data[i].from) && (a.port == data[i].from_port)))) {
          interfaces.push({
            id: len,
            dpid: data[i].from,
            port: data[i].from_port
          })
          len++;
        }
        if (!interfaces.some(a => ((a.dpid == data[i].to) && (a.port == data[i].to_port)))) {
          interfaces.push({
            id: len,
            dpid: data[i].to,
            port: data[i].to_port
          })
          len++;
        }
      }
      //jika jumlah interfaces berbeda maka buat ulang daftar interfaces
      if (len != cmp) {
        grafik();
      }
    }
  })

  //ambil daftar interfaces dari link switch ke host
  socket.on("hosts", function (data) {
    if (data) {
      let cmp = len;
      for (i in data) {
        if (!interfaces.some(a => ((a.dpid == data[i].to) && (a.port == data[i].to_port)))) {
          interfaces.push({
            id: len,
            dpid: data[i].to,
            port: data[i].to_port
          })
          len++;
        }
      }
      if (len != cmp) {
        grafik();
      }
    }
  })

  //ambil data metrik dari sflow
  socket.on("metrics", function (data) {
    if (data) {
      let int = get_int()
      if (data.length > 0) {
        for (i in int) {
          let z = int[i].id
          let metric = data.filter(a => (("of:" + a.of_dpid) == int[i].dpid) && (a.of_port == int[i].port))
          if (metric.length > 0) {
            metric.forEach(d => {
              val[z].push([new Date(), Math.round(d.ifinoctets / 1000), Math.round(d.ifoutoctets / 1000)]);
            })
            g[z].updateOptions({ 'file': val[z] });
          }
        }
      }
    }
  })

});
