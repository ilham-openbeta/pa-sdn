var options = {
  edges: {
    width: 3,
    color: { color: "#007FFF" },
    smooth: {
      type: "continuous",
      roundness: 1
    },
    font: {
      align: "middle",
      strokeWidth: 0,
      background: "aqua"
    },
  },
  groups: {
    switch: {
      image: "/img/sq_switch_blue.svg",
      shape: "image",
    },
    host: {
      image: "/img/c_client_vm.svg",
      shape: "image",
    }
  },
  layout: { randomSeed: 100 },
  physics: { solver: "repulsion" }
};
var nodes = new vis.DataSet();
var edges = new vis.DataSet();
var network;
var socket = io();

//tampilkan kecepatan & tanda panah
var speed = true;
var arrows = false;

//ubah util ke true untuk menggunakan data utilisasi, 
//false untuk menggunakan data througput (kbps) sebagai penentu warna link
//atur batas max KB/s jika util=false 
var util = true;
var max_kbps = 50000;

$(function () {
  //ambil daftar perangkat switch
  socket.on("nodes", function (data) {
    let group = nodes.get({
      filter: function (item) {
        return (item.group == "switch");
      }
    });
    //jika jumlahnya berbeda maka buat ulang daftar perangkat
    if (data.length != group.length) {
      nodes.remove(group);
      network.setOptions({ physics: true });
      for (i in data) {
        nodes.add(
          {
            id: data[i].id,
            label: data[i].id,
            group: "switch",
            detail: data[i]
          }
        );
      }
    }
  });

  //ambil daftar link antar switch
  socket.on("links", function (data) {
    let group = edges.get({
      filter: function (item) {
        return (item.group == "link-switch");
      }
    });
    //jika jumlahnya berbeda maka buat ulang daftar link
    if (data.length != group.length) {
      edges.remove(group);
      let arr = ""
      if (arrows) {
        arr = "to"
      }
      for (i in data) {
        edges.add({
          id: data[i].id,
          from: data[i].from,
          to: data[i].to,
          group: "link-switch",
          arrows: arr,
          detail: data[i]
        });
      }
    }
  });

  //ambil daftar host
  socket.on("hosts", function (data) {
    let group = nodes.get({
      filter: function (item) {
        return (item.group == "host");
      }
    });
    //jika jumlah perangkat host berbeda maka buat ulang daftar host
    if (data.length != group.length) {
      nodes.remove(group);
      network.setOptions({ physics: true });
      for (i in data) {
        nodes.add(
          {
            id: data[i].mac,
            label: data[i].mac,
            group: "host",
            detail: data[i]
          }
        );
      }
    }
    group = edges.get({
      filter: function (item) {
        return (item.group == "link-host");
      }
    });
    //jika jumlah link antar host berbeda maka buat ulang daftar link
    if (data.length != group.length) {
      edges.remove(group);
      let arr = ""
      if (arrows) {
        arr = "from"
      }
      for (i in data) {
        edges.add({
          id: data[i].mac,
          from: data[i].mac,
          to: data[i].to,
          arrows: arr,
          group: "link-host"
        });
      }
    }
  });

  //ambil daftar nilai througput perangkat
  socket.on("metrics", function (data) {
    let temp = edges.get();
    //reset warna link
    for (i in temp) {
      edges.update({ id: temp[i].id, width: 3, color: { color: "#007FFF" } });
      if (speed) {
        edges.update({ id: temp[i].id, label: "0 KB/s" });
      }
    }
    for (i in data) {
      let link = edges.get({
        filter: function (item) {
          if (item.group == "link-switch") {
            if ((item.detail.from == ("of:" + data[i].of_dpid)) && (item.detail.from_port == data[i].of_port) ||
              ((item.detail.to == ("of:" + data[i].of_dpid)) && (item.detail.to_port == data[i].of_port))
            ) {
              return true;
            }
          } else if (item.group == "link-host") {
            if ((item.to == ("of:" + data[i].of_dpid)) && (nodes.get(item.id).detail.to_port == data[i].of_port)) {
              return true;
            }
          } else {
            return false;
          }
        }
      });
      let total;
      if (util) {
        total = data[i].ifinutilization + data[i].ifoututilization;
      } else {
        total_throughput = Math.round((data[i].ifinoctets + data[i].ifoutoctets) / 1000)
        total = total_throughput / max_kbps * 100
      }
      //atur warna link
      if (link.length > 0) {
        if (speed) {
          let throughput = Math.round((data[i].ifinoctets + data[i].ifoutoctets) / 1000) + " KB/s";
          edges.update({ id: link[0].id, label: throughput })
        }
        if (total > 80) {
          edges.update({ id: link[0].id, width: 7, color: { color: "#FF0000" } })
        } else if (total > 60) {
          edges.update({ id: link[0].id, width: 6, color: { color: "#FF8000" } })
        } else if (total > 40) {
          edges.update({ id: link[0].id, width: 5, color: { color: "#FFFF00" } })
        } else if (total > 20) {
          edges.update({ id: link[0].id, width: 4, color: { color: "#80FF00" } })
        } else if (total > 0) {
          edges.update({ id: link[0].id, width: 3, color: { color: "#007FFF" } })
        }
      }
    }
  })

  let container = $(".vis-network")[0];
  let data = {
    nodes: nodes,
    edges: edges
  };
  network = new vis.Network(container, data, options);
  network.on("afterDrawing", function (params) {
    $('.kotak').remove();
    let html =
      '<div class="kotak">' + "&nbsp;Keterangan :" +
      '<div class="kotak-warna" style="background-color: #FF0000;"></div>' +
      '<div class="kotak-teks">80 - 100 %</div>' +
      '<div class="kotak-warna" style="background-color: #FF8000;"></div>' +
      '<div class="kotak-teks">60 - 80 %</div>' +
      '<div class="kotak-warna" style="background-color: #FFFF00;"></div>' +
      '<div class="kotak-teks">40 - 60 %</div>' +
      '<div class="kotak-warna" style="background-color: #80FF00;"></div>' +
      '<div class="kotak-teks">20 - 40 %</div>' +
      '<div class="kotak-warna" style="background-color: #007FFF;"></div>' +
      '<div class="kotak-teks">0 - 20 %</div>' +
      '</div>'
    $('.vis-network').append(html);
  })
  network.on("click", function (params) {
    let html;
    if (params.nodes.length == 0 && params.edges.length != 0) {
      //Link
      let edge = edges.get(params.edges[0])
      if (edge.group == "link-switch") {
        html =
          "<div class='overlay'>" +
          "<b>INFO LINK</b> <br>" +
          "<hr style='margin:auto;margin-bottom:0.8em;border:1px solid black'>" +
          "Dari : " +
          "<br>DPID : " + edge.detail.from +
          "<br>OF Port : " + edge.detail.from_port +
          "<hr style='margin:0.5em 0;'>" +
          "Ke : " +
          "<br>DPID : " + edge.detail.to +
          "<br>OF Port : " + edge.detail.to_port +
          "</div>"
      } else if (edge.group == "link-host") {
        let node = nodes.get(edge.id)
        html =
          "<div class='overlay'>" +
          "<b>INFO LINK</b> <br>" +
          "<hr style='margin:auto;margin-bottom:0.8em;border:1px solid black'>" +
          "Dari Host : " +
          "<br>IP Address : " + node.detail.ip +
          "<br>MAC Address : " + node.detail.mac +
          "<hr style='margin:0.5em 0;'>" +
          "Ke Switch : " +
          "<br>DPID : " + node.detail.to +
          "<br>OF Port : " + node.detail.to_port +
          "</div>"
      }
      $('.overlay').remove();
      $('.vis-network').append(html);
    } else if (params.nodes.length != 0) {
      //Node
      let node = nodes.get(params.nodes[0])
      if (node.group == "switch") {
        html =
          "<div class='overlay'>" +
          "<b>INFO PERANGKAT</b> <br>" +
          "<hr style='margin:auto;margin-bottom:0.8em;border:1px solid black'>" +
          "DPID : " + params.nodes[0] +
          "<br>IP Address : " + node.detail.ip +
          "<br>Hardware : " + node.detail.hardware +
          "<br>Protocol : " + node.detail.protocol +
          "<br><a href='/grafik?dpid=" + params.nodes[0] + "' style='color:red'>Lihat Grafik >></a>" +
          "</div>"
      } else if (node.group == "host") {
        html =
          "<div class='overlay'>" +
          "<b>INFO PERANGKAT</b> <br>" +
          "<hr style='margin:auto;margin-bottom:0.8em;border:1px solid black'>" +
          "IP Address : " + node.detail.ip +
          "<br>MAC Address : " + node.detail.mac +
          "</div>"
      }
      $('.overlay').remove();
      $('.vis-network').append(html);
    } else {
      //Kanvas
      $('.overlay').remove();
    }
  });

  network.on("stabilized", function (params) {
    if (params.iterations > 10) {
      network.setOptions({ physics: false });
    }
  });

  // Web Socket error handling

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
    console.log("Disconnected")
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log("Reconnecting ...")
  });

  socket.on('reconnect_error', (error) => {
    console.log("Reconnect Error: " + error)
  });

  socket.on('reconnect_failed', () => {
    console.log("Gagal Reconnect")
  });
});
