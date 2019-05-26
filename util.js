

var LPQ = {
  init() {
    return {
      todo: [],
      running: false,
      on_done: null,
    };
  },
  set_on_done(lpq, on_done) {
    lpq.on_done = on_done;
  },
  add(lpq, fn, take_last) {
    var finished = () => {
      if (lpq.todo.length == 0) {
        lpq.running = false;
        if (lpq.on_done != null) {
          lpq.on_done();
        }
      } else {
        if (take_last) {
          lpq.todo.pop()(finished);
          lpq.todo = [];
        } else {
          lpq.todo.shift()(finished);
        }
      }
    }

    if (!lpq.running) {
      lpq.running = true;
      fn(finished)
    } else {
      lpq.todo.push(fn);
    }
  },
  test() {

    var lpq = LPQ.init()

    var a = Date.now()

    LPQ.add(lpq, (done) => {
      setTimeout(() => {
        console.log('A', Date.now() - a);
        done();
      }, 250);
    });

    LPQ.add(lpq, (done) => {
      setTimeout(() => {
        console.log('B', Date.now() - a);
        done();
      }, 200);
    });

    LPQ.add(lpq, (done) => {
      setTimeout(() => {
        console.log('C', Date.now() - a);
        done();
      }, 300);
    });

    setTimeout(() => {
      LPQ.add(lpq, (done) => {
        setTimeout(() => {
          console.log('C', Date.now() - a);
          done();
        }, 100);
      });
    }, 1000);

  }
};

(function(window){
  window.utils = {
    parseQueryString: function(str) {
      var ret = Object.create(null);

      if (typeof str !== 'string') {
        return ret;
      }

      str = str.trim().replace(/^(\?|#|&)/, '');

      if (!str) {
        return ret;
      }

      str.split('&').forEach(function (param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        // Firefox (pre 40) decodes `%3D` to `=`
        // https://github.com/sindresorhus/query-string/pull/37
        var key = parts.shift();
        var val = parts.length > 0 ? parts.join('=') : undefined;

        key = decodeURIComponent(key);

        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val === undefined ? null : decodeURIComponent(val);

        if (ret[key] === undefined) {
          ret[key] = val;
        } else if (Array.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
      });

      return ret;
    }
  };
})(window);
