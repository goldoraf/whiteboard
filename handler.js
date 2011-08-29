(function(){
    SocketHandler = function(socket) {
        this.socket = socket;
        this.listeners = {};
        
        var self = this;
        this.socket.on('message', function(obj) {
            if ('buffer' in obj) {
                for (var i in obj.buffer) {
                    if (self.listeners[obj.buffer[i].action]) {
                        self.listeners[obj.buffer[i].action].handle(obj.buffer[i]);
                    } else {
                        alert('Unknown action: '+obj.buffer[i].action);
                    }
                }
            } else {
                if (self.listeners[obj.action]) {
                    self.listeners[obj.action].handle(obj);
                } else {
                    alert('Unknown action: '+obj.action);
                }
            }
        });
    };
    
    SocketHandler.prototype.register = function(action, listener) {
        this.listeners[action] = listener;
    };
    
    SocketHandler.prototype.send = function(data) {
        this.socket.send(JSON.stringify(data));
    };
})();