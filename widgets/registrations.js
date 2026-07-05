function weRegistrations(course, idTotal, idCountries) {
  "use strict";
  var encCourse,
      wFCount = 0;

  function canonicalCourse(course) {
    return course.replace(/[?/ .]/g, '_');
  }

  function displayValue(id, val) {
    var $el;
    val = parseInt(val, 10);
    $el = $('#' + id);
    // if the element exists, and the value has changed
    // animate showing the new value
    if ($el.length && (parseInt($el.text(), 10) !== val)) {
      $el.fadeOut('fast', function() {
        $el.text(val)
           .fadeIn('slow');
      });
    }
  }

  function goSubscribe() {
    // wait for a Faye client
    if (!window.WEFclient) {
      wFCount++;
      if (wFCount > 5) {
        // if nobody else is going to load one, we better
        window.WEFclient = {};

        // start loading Faye client
        $.getScript('http://s.oerfoundation.org/faye.js', function() {
          // jQuery 1.9 has removed $.browser
          function msie() {
            return navigator.appName == 'Microsoft Internet Explorer';
          }
          function msieVer() {
            var ua = navigator.userAgent;
            var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
            if (re.exec(ua) != null) {
              return parseFloat(RegExp.$1);
            }
            return -1;
          }

          if (!window.WEFclient || (typeof window.WEFclient.subscribe !== 'function')) {
            window.WEFclient = new Faye.Client('http://s.oerfoundation.org:80/faye', {
              timeout: 120
            });
            if (msie && msieVer <= 8) {
              window.WEFclient.disable('autodisconnect');
            }
          }
        });
      }
      setTimeout(goSubscribe, 250);
      return;
    } else if (!window.WEFclient.subscribe || (typeof window.WEFclient.subscribe != 'function')) {
      // waiting for the client to appear
      setTimeout(goSubscribe, 400);
      return;
    }
    var client = window.WEFclient;
    // subscribe to the feed
    var subscription = client.subscribe('/registrations/' + canonicalCourse(course), function (msg) {
      var total;
      if (msg && msg.total) {
        displayValue(idTotal, msg.total);
        if (msg.countries && idCountries) {
          displayValue(idCountries, msg.countries);
        }
      }
    });
  }

  encCourse = encodeURIComponent(canonicalCourse(course));

  goSubscribe();

  // get the initial static count
  $.ajax({
    url: 'http://s.oerfoundation.org/registrations/' + encCourse + '.json',
    dataType: 'jsonp',
    success: function(data) {
      if (data && data.hasOwnProperty('total') && data.hasOwnProperty('countries')) {
        displayValue(idTotal, data.total);
        displayValue(idCountries, data.countries);
      }
    }
  });
}

