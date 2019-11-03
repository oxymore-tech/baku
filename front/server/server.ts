
var express = require('express');
var fs = require('fs');
var app = express();
var historyfallback = require('connect-history-api-fallback');
var https = require('https').createServer({
    key: fs.readFileSync('server/server.key'),
    cert: fs.readFileSync('server/server.cert')
}, app)
var io = require('socket.io')(https);

// interface Offers {
//     [id: string]: RTCSessionDescriptionInit
// }
interface Link {
    [id: string]: string;
}

const links: Link = {};
app.use(historyfallback())
app.use(express.static('dist'));

io.on('connection', function (socket: any) {

    socket.on('link', function (msg: string) {
        const clientid = JSON.parse(msg);
        console.log('link', clientid);
        links[socket.id] = clientid;
        links[clientid] = socket.id;
        io.to(clientid).emit('linkEstablished', 'ok');
    });

    socket.on('rtcOffer', function (msg: any) {
        console.log('rtcOffer');
        io.to(links[socket.id]).emit('rtcOffer', msg);
    });

    socket.on('rtcAnswer', function (msg: any) {
        console.log('rtcAnswer');
        io.to(links[socket.id]).emit('rtcAnswer', msg);
    });

    socket.on('icecandidate', function (msg: any) {
        console.log('icecandidate');
        io.to(links[socket.id]).emit('icecandidate', msg);
    });
});

https.listen(3000, function () {
    console.log('Example app listening on port 3000! Go to https://localhost:3000/')
})