//
(function () {
  var jQueryUIURL = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js',
      jQueryUICSSURL = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/smoothness/jquery-ui.css';
  var rc, flag = '', flagurl = '';
  var weAPI = mw.config.get('wgServer') + '/api.php';

  function escapeWikitext(s) {
    // FIXME allow templates within the textarea?
    s = s.replace(/[{}]/g, '');
    return s.replace(/\|/g, '{{!}}');
  }

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

  function showForm() {
    var form = '<div style="float: right; width: 200px; height: 200px; background: #eee;"></div>' +
      '<div style="float: left;"><form action="#">' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="order">Order:' +
      '</label></span>' +
      '<input id="order" type="text" size="40" />' +
      '</div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="family">Family: </label></span>' +
      '<input id="family" type="text" size="40" />' +
      '</div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="genus">Genus: </label></span>' +
      '<input id="genus" type="text" size="40" />' +
      '</div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="name"><span style="color: red;">*</span> Name:' +
      '</label></span>' +
      '<input id="name" type="text" size="40" />' +
      '</div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="link">Link: </label></span>' +
      '<input id="link" type="text" size="40" />' +
      '</div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="image">Image: </label></span>' +
      '<input id="image" type="text" size="40" />' +
      '</div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel">' +
      '<label for="text">Text: </label></span>' +
      '<textarea id="text" type="textarea" rows="10" cols="40" />' +
      '</textarea></div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel" style="color: red; font-size: smaller">' +
      '* required</span>' +
      '<input id="weInsectButton" type="submit" value="Add" />' +
      '</div>' +
      '</form></div>';
    $('.weAddInsectButtonSpinner').hide();
    $('.weAddInsectButton').hide();
    $('<div id="weDialog" style="display:none">' + form + "</div>\n")
      .appendTo('body');
    $('span.weLabel').css({'width': '120px', 'padding-right': '15px',
      'float': 'left', 'text-align': 'right'});
    $('#genus').blur(function() {
      if (($('#genus').val() !== '') && ($('#name').val() === '')) {
        $('#name').val($('#genus').val());
      }
    });
    $('#weDialog').dialog({height: 580, width: 830, modal: true,
      resizable: true,
      title: 'Add an insect to the page'});
    $('#weInsectButton').click(function() {
      if ($.trim($('#name').val()) === '') {
        return;
      }
      $(this).attr('disabled', 'disabled');
      $(this).replaceWith('<img src="/skins/common/images/Ajax-loader.gif">');
      var params = ['name', 'order', 'family', 'genus', 'image',
        'link', 'text'];
      var data = "{{InsectSection\n";
      for (var p in params) {
        if (params.hasOwnProperty(p)){
          data += '|' + params[p] + '=';
          var v = $.trim($('#' + params[p]).val());
          if (v !== '') {
            data += escapeWikitext(v);
          }
          data += "\n";
        }
      }
      data += "}}\n";
      // load the wikitext and an edit token
      var weAPI = mw.config.get('wgServer') + '/api.php';
      $.ajax({
        type: 'POST',
        url: weAPI,
        data: {
          action: 'query',
          prop: 'info|revisions',
          intoken: 'edit',
          titles: mw.config.get('wgPageName'),
          rvprop: 'content',
          format: 'json'
        },
        error: function(hdr, stat, err) {
          alert("Unable to fetch data page!\n" + stat);
        },
        success: function (d) {
          var page, token, wikitext;
          var name = $.trim($('#name').val());
          for (var pg in d.query.pages) {
            page = d.query.pages[pg];
            token = page.edittoken;
            wikitext = page.revisions[0]['*'];
          }
          $.ajax({
            type: 'POST',
            url: weAPI,
            data: {
              action: 'edit',
              title: mw.config.get('wgPageName'),
              summary: 'added ' + name,
              text: wikitext.replace('{{#widget:InsectAdd}}',
                data + "\n{{#widget:InsectAdd}}"),
              token: token,
              watchlist: 'watch',
              format: 'json'
            },
            error: function(hdr, stat, err) {
              alert("Unable to save new insect!\n" + stat);
            },
            success: function (d) {
              $('#weDialog').dialog('close');
              window.location.reload(true);
            }
          });
        }
      });
    });
  }
  var addButton = '';
  if (mw.config.get('wgUserName') !== null) {
    addButton = '<input type="submit" class="weAddInsectButton" value="Add an Insect" />';
  }
  $('.weInsectAdd').append(addButton);
  $('.weAddInsectButton').click(function() {
    $('.weAddInsectButton').attr('disabled', 'disabled');
    if (typeof $('#weDialog').dialog !== 'function') {
      $('.weAddInsectButton').replaceWith('<img class="weAddInsectButtonSpinner" src="/skins/common/images/Ajax-loader.gif">');
      $('head').append('<link rel="stylesheet" href="' + jQueryUICSSURL +
        '" type="text/css" />');
      $.getScript(jQueryUIURL, showForm);
    } else {
      showForm();
    }
  });
}());

