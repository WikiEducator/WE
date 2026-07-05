$(function() {
  var url = '',
      token = '',
      text = '';

  function API(data, success, failure) {
    data.action || (data.action = 'query');
    data.format || (data.format = 'json');
    $.ajax({
      url: window.wgServer + '/api.php',
      type: 'POST',
      data: data,
      success: success,
      failure: failure
    });
  }

  console.log("blogURL", wgUserName, wgTitle);
  if (wgUserName == wgTitle.split('/')[0]) {
    //console.log('my course dashboard');
    $('a#Blog').next().after('<br /><form action="#"><label for="blogURL">Update Blog URL:</label>&nbsp;&nbsp;<input type="text" id="blogURL" name="blogURL" size="60" /><input type="submit" value="Update" id="weUBU"/><img id="weUBSpinner" src="/skins/common/images/ajax-loader.gif" height=16 width=16 style="display: none" /></form>');
  }
  // get the current URL and populate the form
  API({
    titles: wgPageName,
    prop: 'revisions',
    rvprop: 'content'
  }, function(d) {
    var i, r;
    //console.log(d);
    if (d && d.query && d.query.pages) {
      for (i in d.query.pages) {
        if (i > 0) {
          text = d.query.pages[i].revisions[0]['*'];
          //console.log(text);
          r = /{{CourseBlog\|(?:1=)?([^} ]+)/.exec(text);
          //console.log(r);
          if (r && r.length > 1) {
            url = $.trim(r[1]);
            //console.log('url', url);
            $('#blogURL').val(url);
          }
        }
      }
    }
  });
  // get an edit token
  API({
    prop: 'info',
    intoken: 'edit',
    titles: wgPageName
  }, function(d) {
    var i;
    //console.log(d);
    if (d && d.query && d.query.pages) {
      //console.log(d.query.pages);
      for (i in d.query.pages) {
        //console.log(i);
        if (i > 0) {
          token = d.query.pages[i].edittoken;
          //console.log('token', token);
        }
      }
    }
  });
  // activate the submit button
  $('#weUBU').click(function() {
    var newurl = $.trim($('#blogURL').val());
    //console.log(text);
    if (token && text && (url != newurl)) {
      text = text.replace(/{{CourseBlog\|[^}]+/, '{{CourseBlog|1=' + newurl);
      $('#weUBU').hide();
      $('#weUBSpinner').show();
      API({
        action: 'edit',
        token: token,
        summary: 'updated Blog URL',
        text: text,
        title: wgPageName
      }, function() {
        window.location.replace(wgServer + '/' + wgPageName + '?weToken=' + Math.random());
      });
    }
    return false;
  });
});
