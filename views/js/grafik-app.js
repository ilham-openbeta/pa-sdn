var g = [];
var val = [];
var interfaces = [];
var socket = io();
var len = 0;
var database = [];
var label = [];

//buat fungsi ubah url & get url berdasar selection
function set_dpid(params) {
  let url = new URL(window.location.href);
  url.searchParams.set('dpid', params);
  window.location.assign(url)
}

function sekarang() {
  let today = new Date();
  let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  return time
}

var desired_range = null,
  animate;

function approach_range(index) {
  if (!desired_range) return;
  let range = g[index].xAxisRange();
  if (Math.abs(desired_range[0] - range[0]) < 1000 &&
    Math.abs(desired_range[1] - range[1]) < 1000) {
    g[index].updateOptions({
      dateWindow: desired_range
    })
  } else {
    let new_range;
    new_range = [0.5 * (desired_range[0] + range[0]),
      0.5 * (desired_range[1] + range[1])
    ];
    g[index].updateOptions({
      dateWindow: new_range
    })
    animate(index);
  }
}
animate = function (index) {
  setTimeout(approach_range, 50, index);
};

function zoom(periode) {
  let from = new Date()
  let to = new Date()
  if (periode == "1") {
    from.setMinutes(from.getMinutes() - 5)
  } else if (periode == "2") {
    from.setHours(from.getHours() - 1)
  } else if (periode == "3") {
    from.setDate(from.getDate() - 1)
  } else if (periode == "4") {
    from.setDate(from.getDate() - 7)
  } else if (periode == "5") {
    from.setMonth(from.getMonth() - 1)
  } else {
    from.setFullYear(from.getFullYear() - 1)
  }
  desired_range = [from.getTime(), to.getTime()]
  g.forEach(function (item, index) {
    animate(index)
  })
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

  function set_label() {
    if (label.length > 0) {
      let int = get_int()
      for (d of label) {
        $('.perangkat option[value="' + d.id + '"]').html(d.label)
        if (d.id == int[0].dpid) {
          g.forEach((a, i) => {
            let oldtitle = g[i].getOption("title")
            let newtitle = d.label + " port " + oldtitle.split(" ")[2]
            g[i].updateOptions({
              title: newtitle
            })
          })
        }
      }
    }
  }

  //ambil data metrik dari influx
  socket.on("init", function (data) {
    if (data) {
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
        g[z].updateOptions({
          file: val[z]
        });
      }
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
      if (typeof (val[z]) == "undefined") {
        val[z] = []
      }
      if (val[z].length == 0) {
        val[z].push([new Date(), 0, 0]);
      }

      //buat grafik
      let html = "<div class='grafik'></div><div class='empty-space'></div>"
      $('.container').append(html);
      let container = $(".grafik")[i];
      let from = new Date()
      from.setMinutes(from.getMinutes - 5)
      let to = new Date()
      g[z] = new Dygraph(container, val[z], {
        title: int[i].dpid + " port " + int[i].port,
        drawPoints: true,
        animatedZooms: true,
        labels: ['Tanggal', 'IN', 'OUT'],
        ylabel: "Throughput (KB/s)",
        xlabel: "Waktu",
        dateWindow: [from.getTime(), to.getTime()]
      });
    }
    set_label()
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
            let from = new Date()
            let to = new Date()
            let periode = $(".period option:selected").val()
            if (periode == "1") {
              from.setMinutes(from.getMinutes() - 5)
            } else if (periode == "2") {
              from.setHours(from.getHours() - 1)
            } else if (periode == "3") {
              from.setDate(from.getDate() - 1)
            } else if (periode == "4") {
              from.setDate(from.getDate() - 7)
            } else if (periode == "5") {
              from.setMonth(from.getMonth() - 1)
            } else {
              from.setFullYear(from.getFullYear() - 1)
            }
            g[z].updateOptions({
              file: val[z],
              dateWindow: [from.getTime(), to.getTime()]
            });
          }
        }
      }
    }
  })

  socket.on("load", function (data) {
    if (data) {
      label = data
      set_label()
    }
  })

  // Web Socket Error Handling

  socket.on('connect_error', (error) => {
    console.log("Connect Error: " + error)
  });

  socket.on('connect_timeout', (timeout) => {
    console.log("Connecting timeout: " + timeout)
  });

  socket.on('error', (error) => {
    console.log("Error: " + error)
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      console.log("Server Disconnected")
      socket.connect();
    }
    console.log(sekarang() + " Web Server terputus " + reason)
    $.notify(sekarang() + " Web Server terputus", "error")
    let a = confirm("Hubungan dengan Web Server terputus. \nKlik OK untuk reload halaman ini.")
    if (a) {
      location.reload(true)
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(sekarang() + " Web Server terhubung " + attemptNumber)
    $.notify(sekarang() + " Web Server terhubung", "success")
  });

  socket.on('reconnect_error', (error) => {
    console.log("Reconnect Error: " + error)
  });

  socket.on('reconnect_failed', () => {
    console.log("Gagal Reconnect")
  });

});