(function() {
  var i, j, title;
  var token = '';
  var bad = [],
      allbadusers = ['Frieda', 'NawlinWiki'];
  var nneedreview = 0;
  var weAPI = mw.config.get('wgServer') + '/api.php';
  var NEWBIE = 20;
  var NEWMSECS = 7*24*60*60*1000;

  function weSpamGetToken(title) {
    var token = '';
    $.ajax({
      url: weAPI,
      data: {
        action: 'query',
        format: 'json',
        prop: 'info',
        titles: title,
        intoken: 'delete'
      },
      async: false,
      dataType: 'json',
      type: 'POST',
      success: function(data) {
        var page, pages;
        pages = data.query.pages;
        for (page in pages) {
          token = pages[page].deletetoken;
          break;
        }
      }
    });
    return token;
  }

  function weDelPage(title) {
    $.ajax({
      url: weAPI,
      data: {
        action: 'query',
        format: 'json',
        titles: title,
        prop: 'revisions',
        rvlimit: 500,
        rvprop: 'user'
      },
      dataType: 'json',
      type: 'POST',
      success: function(data) {
        var allBad = true;
        var page, i, rev, revs, user;
        var pages = data.query.pages;
        for (page in pages) {
          // if page doesn't exist, short-circuit deleting it
          if (pages[page].hasOwnProperty('missing')) {
            allBad = false;
            break;
          } else {
            revs = pages[page].revisions;
            for (i=0; i<revs.length; i++) {
              rev = revs[i];
              user = rev.user;
              if ($.inArray(user, allbadusers) === -1) {
                allBad = false;
                nneedreview += 1;
                $('#spamreview').append('<li>requires review: <a class="plainlinks" href="/' + title + '">' + title + '</a> because of ' + user + '</li>');
                break;
              }
            }
          }
        }
        if (allBad) {
          $.ajax({
            url: weAPI,
            data: {
              action: 'delete',
              format: 'json',
              title: title,
              token: token,
              reason: 'Suspected spam. Contact wikispam@wikieducator to discuss.'
            },
            dataType: 'json',
            type: 'POST',
            success: function(data) {
              $('#bodyContent li a[title$="' + title + '"]')
                .parents('li')
                .hide();
              doClean();
            }
          });
        } else {
          doClean();
        }
      }
    });
  }

  function weBadUser(user) {
    // find all contributions by this user
    $.ajax({
      url: weAPI,
      data: {
        action: 'query',
        format: 'json',
        list: 'usercontribs',
        ucuser: user
      },
      dataType: 'json',
      type: 'POST',
      success: function(data) {
        var i, pages;
        pages = data.query.usercontribs;
        for (i = 0; i < pages.length; i++) {
          bad.push({"page": pages[i].title});
        }
        if (token === '') {
          token = weSpamGetToken('Main_Page');
        }
        $.ajax({
          url: weAPI,
          data: {
            action: 'block',
            format: 'json',
            user: user,
            token: token,
            reason: 'Suspected spam. Contact wikispam@wikieducator to discuss.',
            autoblock: 1,
            nocreate: 1
          },
          dataType: 'json',
          type: 'POST',
          success: function(data) {
            var spamusers = [];
            for (var i=0; i<bad.length; ++i) {
              if (typeof(bad[i]) === 'string') {
                spamusers.push(bad[i]);
              }
            }
            $('#spamusers').text(spamusers.join(' '));
            doClean();
          }
        });
      }
    });
  }

  // workhorse tail function that processes until 'bad' array is emptied
  function doClean() {
    var i;
    if (bad.length <= 0) {
      $('#spamdiv').css('background-color',
        (nneedreview) ? 'Yellow' : 'LightGreen');
      if (nneedreview === 0) {
        var url = window.location.href;
        var tick = 'WEtick=' + new Date().getTime();
        if (url.indexOf('?') > -1) {
          if (url.indexOf('WEtick=') > -1) {
            window.location = url.replace(/WEtick=\d+/, tick);
          } else {
            window.location = url + '&' + tick;
          }
        } else {
          window.location = url + '?' + tick;
        }
      }
      return false;
    }
    i = bad.pop();
    if (typeof(i) === 'string') {
      // get all pages by the user
      //   pushing them onto bad list
      //   then callback blocks user
      weBadUser(i);
    } else {
      // get all contributors to this page
      //   then callback checks if they are all bad
      //     and if so, deletes the page
      //     otherwise it marks the page as needing review
      weDelPage(i.page);
    }
  }

  function hideOldies(d) {
    var i, users, usersLen, userTitle;
    var hideParent = 'li';
    var enhancedRC = false;
    if (d && d.query && d.query.users) {
      users = d.query.users;
      usersLen = users.length;
      // detect enhanced RecentChanges
      if (mw.config.get('wgCanonicalSpecialPageName') === 'Recentchanges') {
        hideParent = $('.mw-userlink').parent()
          .prop('tagName').toLowerCase();
        if (hideParent !== 'li') {
          hideParent = 'tr';
          enhancedRC = true;
        }
      }
      for (i=0; i<usersLen; i++) {
        if (!users[i].registration) {
          users[i].registration='2006-01-01';
        }
        userAge = new Date() - new Date(users[i].registration)
        if ((users[i].editcount > NEWBIE) && (userAge > NEWMSECS)) {
          userTitle = 'User:' + users[i].name;
          $('.mw-userlink[title="'+userTitle+'"],' +
            '.mw-userlink[title="'+userTitle+' (page does not exist)"]')
            .addClass('old')
            .parents(hideParent).css('opacity', '0.5')
              .css('filter', 'alpha(opacity = 50)');
        }
      }
    }
  }

  if (mw.config.get('wgCanonicalSpecialPageName') === 'Newpages') {
    $('#bodyContent form')
      .first()
      .after('<div id="spamdiv" style="background-color:LightGreen; padding: 10px;"><b>SpamBot</b><div id="spamusers"><br /><br /></div><ul id="spamreview"></ul></div>');
    $('a[href*="Special:Block"], a[href*="Especial:Bloquear"], a[href*="Sp%C3%A9cial:Bloquer"]')
      .after(' | <a class="spammarker" href="javascript:void(0)">mark</a>');
    $('a.spammarker')
      .click(function() {
        var bcolor;
        var spamusers = '';
        var block = $(this).prev('a').attr('href');
        var sp = block.lastIndexOf('/');
        if (sp) {
          // hacky UTF-8 decoding 2012-04-30
          var user = decodeURIComponent(escape(unescape(block.substring(sp+1))));
          var i = $.inArray(user, bad);
          if (i > -1) {
            bad.splice(i, 1);
            bcolor = 'white';
          } else {
            bad.push(user);
            bcolor = 'LightCoral';
          }
          $('#bodyContent li a[href="'+block+'"]')
            .parent()
            .parent()
            .css('background-color', bcolor);
          spamusers = bad.join(' ');
        }
        $('#spamusers').text(spamusers);
        $('#spamdiv').css('background-color',
            spamusers ? 'LightCoral' : 'LightGreen');
        if (spamusers) {
          $('#spamusers').append('<br /><input id="deletespam" type="submit" value="Delete ALL Contributions and Block" />');
          $('#deletespam').click(function() {
            $(this).remove();
            nneedreview = 0;
            for (i = 0; i < bad.length; i++) {
              allbadusers.push(bad[i].replace(/_/g, ' '));
            }
            doClean(); 
          });
        }
      });
  }
  var user;
  var users = [];
  $('.mw-userlink').each(function(ix, el) {
    user = $(this).text();
    if ($.inArray(user, users) === -1) {
      users.push(user);
    }
  });
  $.ajax({
    url: weAPI,
    data: {
      action: 'query',
      format: 'json',
      list: 'users',
      usprop: 'groups|registration|editcount',
      ususers: users.join('|')
    },
    dataType: 'json',
    type: 'POST',
    success: hideOldies
  });
}());
