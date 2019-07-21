const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');

const app = express();

const port = process.env.PORT || 7000;
app.listen(port, ()=> console.log(`Server jalan di port ${port}`));

app.use(bodyparser.json());
app.use(cors());
app.use('/src', express.static(__dirname + '/node_modules/vis/dist'));
app.use('/img', express.static(__dirname + '/svg'));

const posts = require('./routes/api/posts');
app.use('/api/posts',posts)

app.get('/', function(request, response){
    response.sendFile(__dirname+'/index.html');
});