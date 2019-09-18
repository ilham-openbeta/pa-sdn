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
app.use("/css", express.static(__dirname + "/views/css"));
app.use("/img", express.static(__dirname + "/views/img"));
app.use("/js", express.static(__dirname + "/views/js"));
app.get("/topologi", (req, res) => res.sendFile(__dirname + "/views/topologi.html"));
app.get("/grafik", (req, res) => res.sendFile(__dirname + "/views/grafik.html"));
app.get("/grafik/*", (req, res) => res.sendFile(__dirname + "/views/grafik.html"));
app.get("/laporan", (req, res) => res.sendFile(__dirname + "/views/laporan.html"));
app.get("/playground", (req, res) => res.sendFile(__dirname + "/views/playground.html"));
app.get("*", (req, res) => res.sendFile(__dirname + "/views/topologi.html"));

const main = require("./controllers/main")
main(io)