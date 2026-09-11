/* ============================================================
 * tour.js —— 巡游系统 (对应原站 tour.js，巡游站点由 main 生成)
 * ============================================================ */

var TOUR_STOPS = [];

var Tour = function (stops) {
  this.current = 0;
  this.states = stops;
  this.touring = false;
  this.timingBuffer = 0;
  this.timers = [];
  this.content = theaterMessageEl;
  this.top = topBarEl;
  this.bottom = bottomBarEl;
};

Tour.Easing = TWEEN.Easing.Sinusoidal.InOut;
Tour.Duration = 250;
Tour.meta = metaEl;
Tour.timeouts = [];

Tour.prototype = {

  start: function () {
    var _this = this;

    metaLinkEl.innerHTML = 'Stop';
    metaLinkEl.onclick = function (e) {
      e.preventDefault();
      _this.stop();
    };

    _this.current = 0;
    _this.touring = false;
    _this.timingBuffer = 0;

    _this.content.innerHTML = '';
    fadeOut(Tour.meta, 200);
    fadeOut(theaterEl, 200);

    closeDetail();
    followTarget = null;
    centerOn(new THREE.Vector3(0, 0, 0));

    this.show(function () {
      camera.__tour = _this.touring = true;
      _this.current = 0;
      _this.next(true);
    });

    return this;
  },

  stop: function () {
    this.hide();
    camera.__tour = false;
    this.touring = false;
    rotateX = rotating.rotation.x;
    rotateY = rotating.rotation.y;
    TWEEN.removeAll();
    return this;
  },

  show: function (callback) {
    var _this = this;
    theaterEl.style.display = 'block';
    theaterEl.style.opacity = '0';
    requestAnimationFrame(function () {
      theaterEl.style.transition = 'opacity 200ms';
      theaterEl.style.opacity = '1';
      fadeIn(Tour.meta, 200);
      slideProp(_this.bottom, 'marginBottom', 0, Tour.Duration);
      slideProp(_this.top, 'marginTop', 0, Tour.Duration, function () {
        theaterEl.style.transition = '';
        if (callback) callback.call(_this);
      });
    });
    return this;
  },

  hide: function (callback) {
    var _this = this;
    fadeOut(Tour.meta, 200);
    slideProp(_this.bottom, 'marginBottom', -75, Tour.Duration);
    slideProp(_this.top, 'marginTop', -75, Tour.Duration, function () {
      theaterEl.style.transition = 'opacity 200ms';
      theaterEl.style.opacity = '0';
      setTimeout(function () {
        theaterEl.style.display = 'none';
        theaterEl.style.transition = '';
        if (callback) callback.call(_this);
      }, 200);
    });
    return this;
  },

  showMessage: function (message, duration, callback) {
    var _this = this;
    _this.show();

    var onStart = function () {
      _this.content.innerHTML = '<p><span>' + message + '</span></p>';
      _this.content.style.display = 'block';
      _this.content.style.opacity = '0';
      requestAnimationFrame(function () {
        _this.content.style.transition = 'opacity 400ms';
        _this.content.style.opacity = '1';
      });

      metaLinkEl.innerHTML = 'Skip';
      metaLinkEl.onclick = function (e) {
        e.preventDefault();
        _this.hide();
        fadeOut(Tour.meta, 200);
        _this.timingBuffer = 0.0;
        _this.clearTimers();
        firstTime = false;
      };
    };
    _this.timers.push(window.setTimeout(onStart, _this.timingBuffer + 1000.0));

    var onFinished = function () {
      _this.content.style.transition = 'opacity 300ms';
      _this.content.style.opacity = '0';
      setTimeout(function () {
        if (callback) callback();
      }, 300);
    };

    _this.timingBuffer += duration + 1000.0;
    _this.timers.push(window.setTimeout(onFinished, _this.timingBuffer));

    return this;
  },

  clearTimers: function () {
    for (var i = 0; i < this.timers.length; i++) {
      window.clearTimeout(this.timers[i]);
    }
  },

  endMessages: function () {
    var _this = this;
    var timer = window.setTimeout(function () {
      _this.hide();
    }, _this.timingBuffer + 1000.0);
    _this.timers.push(timer);
  },

  next: function (continuous) {
    var _this = this;
    var state = this.state = this.states[this.current];
    if (!state) {
      this.stop();
      return this;
    }
    this.current++;

    /* 设定跟随/居中目标 */
    if (state.followIndex !== undefined) {
      var entry = stars[state.followIndex];
      followTarget = entry ? entry.group : null;
      currentStar = entry || null;
      if (entry) centerOn(entry.group.position.clone());
    } else if (state.center) {
      followTarget = null;
      currentStar = null;
      centerOn(new THREE.Vector3(state.center.x, state.center.y, state.center.z));
    }

    if (state.message) {
      if (this.content.style.display != 'none' && this.content.style.opacity != '0') {
        this.content.style.transition = 'opacity 300ms';
        this.content.style.opacity = '0';
        setTimeout(function () {
          _this.content.innerHTML = '<p><span>' + state.message + '</span></p>';
          _this.content.style.transition = 'opacity 400ms';
          _this.content.style.opacity = '1';
        }, 300);
      } else {
        this.content.innerHTML = '<p><span>' + state.message + '</span></p>';
        this.content.style.display = 'block';
        this.content.style.opacity = '1';
      }
    }

    new TWEEN.Tween(rotating.rotation)
      .to({ x: state.rx, y: state.ry }, state.travelTime)
      .easing(Tour.Easing)
      .start();

    new TWEEN.Tween(camera.position)
      .to({ z: state.z }, state.travelTime)
      .easing(Tour.Easing)
      .onComplete(function () {
        camera.position.target.z = camera.position.z;
        setTimeout(function () {
          if (continuous) _this.next(true);
        }, state.restTime);
      })
      .start();

    return this;
  }
};

var tour = new Tour(TOUR_STOPS);
