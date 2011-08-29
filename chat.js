(function(){
    Chat = function(socket, options) {
        this.socket = socket;
        this.socket.register('speak', this);
        this.options = {
            chatElement: 'chat',
            formElement: 'form'
        };
        for (var i in options) 
            if (this.options.hasOwnProperty(i))
                this.options[i] = options[i];
        
        this.chat = document.getElementById(this.options.chatElement);
        this.form = document.getElementById(this.options.formElement);
        
        var self = this;
        this.form.onsubmit = function() {
            var msg = document.getElementById('text').value; //TODO
            self.send(msg);
            document.getElementById('text').value = ''; //TODO
            return false;
        };
        
        self.uiInit(); // TODO : transférer le "Connecting..." vers le SocketHandler
    };
    
    Chat.prototype.send = function(message) {
        this.socket.send({
          action: 'speak',
          type: 'message',
          text: message
        });
        this.message('you', message);
        document.getElementById('text').value = '';
    };
    
    Chat.prototype.handle = function(obj) {
        var type = obj.type;
        if (type == 'message') {
            this.message(obj.author, obj.text);
        } else if (type == 'announcement') {
            this.announce(obj.text);
        }
    };
    
    Chat.prototype.message = function(author, message) {
        this.display('<b>' + this.esc(author) + ':</b> ' + this.esc(message));
    };
    
    Chat.prototype.announce = function(message) {
        this.display('<em>' + this.esc(message) + '</em>');
    };
    
    Chat.prototype.display = function(html) {
        var el = document.createElement('p');
        el.innerHTML = html;
        this.chat.appendChild(el);
        this.chat.scrollTop = 1000000;
    };
    
    Chat.prototype.esc = function(text) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    
    Chat.prototype.uiInit = function() {
        this.form.style.display='block';
        this.chat.innerHTML = '';
    }
})();