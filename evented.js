

function make_evented() {
  var table = {};

  function emit() {
    var args = Array.prototype.slice.call(arguments).slice(1);
    var name = arguments[0];
    table[name].apply(null, args);
  }

  function on(name, fn) {
    table[name] = fn;
  }

  var o = {}
  o.emit = emit
  o.on = on

  return o;
}

function Evented() {
  this.table = {};
}

Evented.prototype.emit = function(){
  var args = Array.prototype.slice.call(arguments).slice(1);
  var name = arguments[0];
  this.table[name].apply(null, args);
}

Evented.prototype.on = function(name, fn){
  this.table[name] = fn;
}
