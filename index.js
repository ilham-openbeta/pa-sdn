const influx = require("./models/influx")
const port = process.env.PORT || 80;
const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const websocket = require("socket.io");
const app = express();
const server = app.listen(port, () => console.log(`Server jalan di port ${port}`));
const io = websocket(server);

app.use(bodyparser.json());
app.use(cors());

// serve static files
app.use("/css", express.static(__dirname + "/views/css"));
app.use("/img", express.static(__dirname + "/views/img"));
app.use("/js", express.static(__dirname + "/views/js"));
app.get("/topologi", (req, res) => res.sendFile(__dirname + "/views/topologi.html"));
app.get("/grafik", (req, res) => res.sendFile(__dirname + "/views/grafik.html"));
app.get("/grafik/*", (req, res) => res.sendFile(__dirname + "/views/grafik.html"));
app.get("/laporan", (req, res) => res.sendFile(__dirname + "/views/laporan.html"));
app.get("/panduan", (req, res) => res.sendFile(__dirname + "/views/panduan.html"));
app.get("/test", (req, res) => res.sendFile(__dirname + "/views/test.html"));
app.get("/tabel", (req, res) => {
    data = {
        dpid: (typeof req.query.dpid !== 'undefined') ? req.query.dpid : '',
        start: (typeof req.query.start !== 'undefined') ? req.query.start * 1000000 : '',
        end: (typeof req.query.end !== 'undefined') ? req.query.end * 1000000 : ''
    }
    influx.get_metrics(data).then(hasil => res.send(hasil))
})
app.get("*", (req, res) => res.sendFile(__dirname + "/views/topologi.html"));

// serve websocket communication to client
const main = require("./controllers/main")
main(io)