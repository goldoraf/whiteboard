(function(){
    Line = function(app) {
        this.app = app;
        this.canvas  = this.app.tmpCanvas;
        this.context = this.app.tmpContext;
        this.started = false;
        this.buffer = [];
    }
    
    Line.prototype.mousedown = function(ev) {
        this.started = true;
        this.x0 = ev._x;
        this.y0 = ev._y;
        this.buffer[0] = [ev._x, ev._y];
        this.buffer[1] = [ev._x, ev._y];
    };
    
    Line.prototype.mousemove = function(ev) {
        if (!this.started) {
            return;
        }
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.beginPath();
        this.context.moveTo(this.x0, this.y0);
        this.context.lineTo(ev._x,   ev._y);
        this.context.stroke();
        this.context.closePath();
        this.buffer[1] = [ev._x, ev._y];
    }
    
    Line.prototype.mouseup = function(ev) {
        if (this.started) {
            this.mousemove(ev);
            this.started = false;
            this.app.imgUpdate();
            this.app.send(this.buffer);
            this.buffer = [];
        }
    };
    
    Line.prototype.draw = function(data) {
        this.context.beginPath();
        this.context.moveTo(data[0][0], data[0][1]);
        this.context.lineTo(data[1][0], data[1][1]);
        this.context.stroke();
        this.context.closePath();
    }
    
    Rectangle = function(app) {
        this.app = app;
        this.canvas  = this.app.tmpCanvas;
        this.context = this.app.tmpContext;
        this.started = false;
        this.buffer = {};
    }
    
    Rectangle.prototype.mousedown = function(ev) {
        this.started = true;
        this.x0 = ev._x;
        this.y0 = ev._y;
    };
    
    Rectangle.prototype.mousemove = function(ev) {
        if (!this.started) {
            return;
        }
        var x = Math.min(ev._x,  this.x0),
            y = Math.min(ev._y,  this.y0),
            w = Math.abs(ev._x - this.x0),
            h = Math.abs(ev._y - this.y0);

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!w || !h) {
            return;
        }
        
        this.buffer = { x: x, y: y, w: w, h: h};
        this.context.strokeRect(x, y, w, h);
    };
    
    Rectangle.prototype.mouseup = function(ev) {
        if (this.started) {
            this.mousemove(ev);
            this.started = false;
            this.app.imgUpdate();
            this.app.send(this.buffer);
            this.buffer = {};
        }
    };
    
    Rectangle.prototype.draw = function(data) {
        this.context.strokeRect(data.x, data.y, data.w, data.h);
        this.app.imgUpdate();
    }
    
    Pencil = function(app) {
        this.app = app;
        this.context = this.app.tmpContext;
        this.started = false;
        this.buffer = [];
    };
    
    Pencil.prototype.mousedown = function(ev) {
        this.context.beginPath();
        this.context.moveTo(ev._x, ev._y);
        this.started = true;
        this.buffer.push([ev._x, ev._y]);
    };
    
    Pencil.prototype.mousemove = function(ev) {
      if (this.started) {
        this.context.lineTo(ev._x, ev._y);
        this.context.stroke();
        this.buffer.push([ev._x, ev._y]);
      }
    };
    
    Pencil.prototype.mouseup = function(ev) {
      if (this.started) {
        this.mousemove(ev);
        this.started = false;
        this.app.imgUpdate();
        this.app.send(this.buffer);
        this.buffer = [];
      }
    };
    
    Pencil.prototype.draw = function(plots) {
        this.context.beginPath();
        this.context.moveTo(plots[0][0], plots[0][1]);
        for (var i=1; i<plots.length; i++) {
            this.context.lineTo(plots[i][0], plots[i][1]);
            this.context.stroke();
        }
        this.app.imgUpdate();
    }
    
    Whiteboard = function(socket, options) {
        this.socket = socket;
        this.socket.register('draw', this);
        this.options = {
            canvasElement: 'whiteboard',
            toolDefault: 'pencil'
        };
        for (var i in options) 
            if (this.options.hasOwnProperty(i))
                this.options[i] = options[i];
        
        this.canvas = document.getElementById(this.options.canvasElement);
        if (!this.canvas) {
            alert('Error: cannot find the canvas element!');
            return;
        }
        if (!this.canvas.getContext) {
            alert('Error: no canvas.getContext!');
            return;
        }
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            alert('Error: failed to getContext!');
            return;
        }
        
        var container = this.canvas.parentNode;
        var tmpCanvas = document.createElement('canvas');
        tmpCanvas.id = 'whiteboard_temp';
        tmpCanvas.width = this.canvas.width;
        tmpCanvas.height = this.canvas.height;
        container.appendChild(tmpCanvas);
        this.tmpCanvas = tmpCanvas;
        this.tmpContext = this.tmpCanvas.getContext('2d');
        
        this.tools = {
            'pencil': new Pencil(this),
            'rect'  : new Rectangle(this),
            'line'  : new Line(this)
        };
        
        this.tool = this.toolDefault = this.options.toolDefault;
        
        var self = this;
        this.toolSelect = document.getElementById('tool');
        this.toolSelect.onchange = function() {
            var tool = this.value;
            if (self.tools[tool]) {
                self.tool = tool;
            }
        }
        
        this.tmpCanvas.addEventListener('mousedown', this, false);
        this.tmpCanvas.addEventListener('mousemove', this, false);
        this.tmpCanvas.addEventListener('mouseup',   this, false);
    };
    
    Whiteboard.prototype.handleEvent = function(ev) {
        if (ev.layerX || ev.layerX == 0) { // Firefox
            ev._x = ev.layerX;
            ev._y = ev.layerY;
        } else if (ev.offsetX || ev.offsetX == 0) { // Opera
            ev._x = ev.offsetX;
            ev._y = ev.offsetY;
        }
        var func = this.tools[this.tool][ev.type];
        if (func) {
            func.call(this.tools[this.tool], ev);
        }
    };
    
    Whiteboard.prototype.imgUpdate = function() {
        this.context.drawImage(this.tmpCanvas, 0, 0);
        this.tmpContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
    }
    
    Whiteboard.prototype.send = function(data) {
        this.socket.send({
          action: 'draw',
          tool: this.tool,
          data: data
        });
    };
    
    Whiteboard.prototype.handle = function(obj) {
        if ('tool' in obj && this.tools[obj.tool] && 'data' in obj) {
            this.tools[obj.tool].draw(obj.data);
        }
    };
    
})();