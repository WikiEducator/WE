(function () {
  var weAPI = mw.config.get('wgServer') + '/api.php',
      delids = [],
      deltimestamps = [],
      restoretimestamps = [],
      badusers = [],
      deltoken, undeltoken;

  // usage: log('inside coolFunc',this,arguments);
  // http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
  window.log = function(){
    log.history = log.history || [];   // store logs to an array for ref
    log.history.push(arguments);
    if(this.console){
      console.log( Array.prototype.slice.call(arguments) );
    }
  };

  function mwAPI(data, success, failure) {
    if (!data.hasOwnProperty('format')) {
      data.format = 'json';
    }
    $.ajax({
      url: weAPI,
      data: data,
      async: false,
      dataType: 'json',
      type: 'POST',
      success: success,
      failure: failure || function() {} // silently fail!
    });
  }

  function processRevs(data) {
    log('processRevs', data);
    log('check against delids', delids);
    log('check against deltimestamps', deltimestamps);
    var revs = data.query && data.query.pages;
    for (var i in data.query.pages) {
      revs = data.query.pages[i].revisions;
      for (var j in revs) {
        var ix = $.inArray(revs[j].revid, delids);
        if (ix === -1) {
          var ts = revs[j].timestamp.replace(/[-T:Z]/g, '');
          if ($.inArray(ts, deltimestamps) === -1) {
            restoretimestamps.push(ts);
          } else {
            log('Previously deleted, do not restore: ' + ts);
          }
        } else {
          log('Not going to restore ' + revs[j].revid + ' : ' + revs[j].timestamp);
        }
      }
    }
    if (data.hasOwnProperty('query-continue')) {
      log('we must continue: ', data['query-continue'].revisions.rvstartid);
      getRevs(mw.config.get('wgPageName'), data['query-continue'].revisions.rvstartid);
    } else {
      log('Total revisions to restore: ' + restoretimestamps.length);
      log('Restore: ' + restoretimestamps.join(' '));
    }
  }

  function getRevs(title, rvcontinue){
    log('getRevs()', title, rvcontinue);
    mwAPI({
        action: 'query',
        format: 'json',
        prop: 'revisions',
        rvprop: 'ids|timestamp',
        titles: mw.config.get('wgPageName'),
        rvlimit: 500,
        rvstartid: rvcontinue || Math.pow(2, 53)
      },
      processRevs);
  }

  function blockBadUsers() {
    if (badusers.length > 0) {
      mwAPI({
        action: 'block',
        format: 'json',
        user: badusers.shift(),
        token: deltoken,
        reason: 'Suspected spam. Contact wikispam@wikieducator to discuss.',
        autoblock: 1
      }, blockBadUsers);
    } else {
      $('#weDeleteRevs').css('background-color', 'LightGreen');
    }
  }

  function undeleteRevs() {
    // restore the good revisions in chunks of 500
    while (restoretimestamps.length > 0) {
      var thisUndelete = restoretimestamps.splice(0, Math.min(500, restoretimestamps.length));
      log('this pass we undelete ' + thisUndelete.length);
      log('leaving ' + restoretimestamps.length);
      mwAPI({
          action: 'undelete',
          title: mw.config.get('wgPageName'),
          token: deltoken,
          reason: 'restore after spam removal',
          timestamps: thisUndelete.join('|')
        }, function() {
          log('undeleted good revs');
          if (restoretimestamps.length > 0) {
            undeleteRevs();
          } else {
            blockBadUsers();
          }
        });
    }
  }

  function weDeleteRevs() {
    log('weDeleteRevs');
    // get a deletion token
    mwAPI({
        action: 'query',
        prop: 'info',
        format: 'json',
        titles: mw.config.get('wgPageName'),
        intoken: 'delete'
      },
      function(d) {
        if (d.query && d.query.pages) {
          for (var i in d.query.pages) {
            if (d.query.pages.hasOwnProperty(i)) {
              deltoken = d.query.pages[i].deletetoken;
              break;
            }
          }
          log(deltoken);

          getRevs(mw.config.get('wgPageName'));
          // delete the page
          mwAPI({
              action: 'delete',
              title: mw.config.get('wgPageName'),
              token: deltoken,
              reason: 'removing spam revision(s)'
            }, undeleteRevs);
        }
      });
  }

  function mark($this, doBlock) {
    var oldid = parseInt($this.closest('li').find('input:radio').val(),
      10);
    var aix = $.inArray(oldid, delids);
    log('oldid', oldid, ' current delids', delids, ' aix', aix);
    var $li = $this.closest('li');
    var $a = $li.find('.history-user>a.mw-userlink');
    var user = $a.text();
    if (aix > -1) {
      delids.splice(aix, 1);
      $li.css('background-color', '');
      // FIXME really should only remove the user from badusers if
      // ALL of their spammy revisions are marked non-spam
      var idx = $.inArray(user, badusers);
      if (idx > -1) {
        badusers.splice(idx, 1);
      }
    } else {
      var answer = 1;
      $a = $li.find('.history-user>a.mw-userlink');
      if ($a && !$a.hasClass('new')) {
        answer = confirm($a.text() + ' is not a redcoat. Really delete this revision?');
      }
      if (answer) {
        delids.push(parseInt(oldid, 10));
        $li.css('background-color', doBlock ? 'LightCoral' : 'Yellow');
        if (doBlock && ($.inArray(user, badusers) === -1)) {
          badusers.push(user);
        }
      }
    }
    log('badusers:', badusers);
    if (delids.length) {
      $('#weDeleteRevs').css('background-color', 'Yellow');
      $('#weDeleteRevsButton').css('visibility', 'visible')
        .removeAttr('disabled');
    } else {
      $('#weDeleteRevs').css('background-color', '');
      $('#weDeleteRevsButton').css('visibility', 'hidden');
    }
  }

  $('.mw-history-undo').after('&nbsp;|&nbsp;<span class="mw-delete-revs"><a href="#" class="we-delete-revs" title="Mark this revision for deletion">mark</a></span>&nbsp;|&nbsp;<span class="mw-delete-revs-block"><a href="#" class="we-delete-revs-block" title="Mark this revision for deletion and user for blocking">mark/block</a></span>');
  $('a.we-delete-revs').click(function() {
    mark($(this), false);
  });
  $('a.we-delete-revs-block').click(function() {
    mark($(this), true);
  });
  $('#mw-history-searchform').after('<div id="weDeleteRevs" style="padding: 10px;"><input id="weDeleteRevsButton" type="submit" value="Delete marked revisions" style="visibility:hidden" /></div>');
  $('#weDeleteRevsButton').click(function(){
    $(this).attr('disabled', 'disabled');
    weDeleteRevs();
  });
}());
