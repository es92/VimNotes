

var LPQ = {
  init() {
    return {
      todo: [],
      running: false
    };
  },
  add(lpq, fn) {
    var finished = () => {
      if (lpq.todo.length == 0) {
        lpq.running = false;
      } else {
        lpq.todo.shift()(finished);
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
}