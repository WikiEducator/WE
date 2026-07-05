(function () {
  var weAPI = wgServer + '/api.php';

  function recentChanges() {
    return $.ajax({
      url: weAPI,
      data: {
        action: 'query',
        list: 'recentchanges',
        rclimit: 50,
        rcprop: 'title|timestamp|ids|user|comment',
        format: 'json'
      },
      dataType: 'json',
      type: 'POST',
    });
  }

  function scaledIFrame(url, height, width) {
    var iframe = '<div style="width: 600px; height: 390px; padding: 0; overflow: hidden;">';
    iframe += '<iframe src="' + url + '" style="width: 800px; height: 520px; border: 1px solid black; zoom: 0.75; -moz-transform: scale(0.75); -moz-transform-origin: 0 0; -o-transform: scale(0.75); -o-transform-origin: 0 0; -webkit-transform: scale(0.75); -webkit-transform-origin: 0 0;"></iframe>';
    iframe += '</div>';
    return iframe;
  }

  var displayed = 0;
  var maxDisplay = 15;
  var rc = recentChanges();
  rc.done(function (data) {
    $('#WEQuickLook').html('');
    if (data.query && data.query.recentchanges) {
      var r = data.query.recentchanges;
      var l = r.length;
      for (var i=0; i<l; i++) {
        var chg = r[i];
        if (chg.type === 'new') {
          $('#WEQuickLook').append('<h4>NEW <span style="color: #999; font-size: smaller;">' + chg.timestamp.replace('T', ' ') + '</span> <a href="' + wgServer + '/' + chg.title + '">' + chg.title + '</a> <a href="' + wgServer + '/User:' + chg.user + '">' + chg.user + '</a></h4>' + scaledIFrame(wgServer + '/' + chg.title, "300", "80%"));
          if (++displayed > maxDisplay) {
            break;
          }
        } else if (chg.type === 'edit') {
          $('#WEQuickLook').append('<h4>EDIT <span style="color: #999; font-size: smaller;">' + chg.timestamp.replace('T', ' ') + '</span> <a href="' + wgServer + '/' + chg.title + '">' + chg.title + '</a> <a href="' + wgServer + '/User:' + chg.user + '">' + chg.user + '</a></h4>' + scaledIFrame(wgServer + '/index.php?title=' + encodeURIComponent(chg.title) + '&diff=' + chg.revid + '&oldid=' + chg.oldid));
          if (++displayed > maxDisplay) {
            break;
          }
        }
      }
    }
    console.log(data);
  });
 
  $('#WEQuickLook').html('Fetching');
})();
