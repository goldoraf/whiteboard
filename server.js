
var sys = require('sys'),
    http = require('http'),
    url = require('url'),
    fs = require('fs'),
    crypto = require('crypto'),
    io = require('../socket.io-node'),
    log = sys.puts,
    
send404 = function(res){
    res.writeHead(404);
    res.write('404');
    res.end();
},
    
server = http.createServer(function(req, res){
    var path = url.parse(req.url).pathname;
    switch (path){
        case '/':
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<h1>Welcome. Try the <a href="/index.html">whiteboard</a>.</h1>');
            res.end();
            break;
            
        default:
            if (/\.(js|html|swf)$/.test(path)){
                try {
                    var swf = path.substr(-4) === '.swf';
                    res.writeHead(200, {'Content-Type': swf ? 'application/x-shockwave-flash' : ('text/' + (path.substr(-3) === '.js' ? 'javascript' : 'html'))});
                    fs.readFile(__dirname + path, swf ? 'binary' : 'utf8', function(err, data){
                        if (!err) res.write(data, swf ? 'binary' : 'utf8');
                        res.end();
                    });
                } catch(e){ 
                    send404(res); 
                }
                break;
            }
        
            send404(res);
            break;
    }
});

server.listen(8084);

var socket = io.listen(server),
    buffer = [];

socket.on('connection', function(client){
  
    client.send({ buffer: buffer });
    client.broadcast({ 
        action: 'speak',
        type: 'announcement',
        text: client.sessionId + ' connected'
    });
  
    client.on('message', function(message){
        try {
            request = JSON.parse(message.replace('<', '&lt;').replace('<', '&gt;'));
        } catch (SyntaxError) {
            log('Invalid JSON:');
            log(message);
            return false;
        }
        
        if (/*request.action != 'close' && */request.action != 'draw' && request.action != 'speak') {
            log('Invalid request:' + "\n" + message);
            return false;
        }
        
        if (request.action == 'speak') {
            var msg = { 
                action: 'speak',
                type: 'message',
                author: client.sessionId,
                text: request.text
            };
            buffer.push(msg);
            if (buffer.length > 15) buffer.shift();
        }
        
        if (request.action == 'draw') {
            var msg = { 
                action: 'draw',
                tool: request.tool,
                author: client.sessionId,
                data: request.data
            };
            buffer.push(msg);
            //if (buffer.length > 15) buffer.shift();
        }
        
        client.broadcast(msg);
    });

    client.on('disconnect', function(){
        client.broadcast({
            action: 'speak',
            type: 'announcement',
            text: client.sessionId + ' disconnected'
        });
    });
});
