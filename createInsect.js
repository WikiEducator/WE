//
(function () {
  "use strict";
  var weAPI = wgServer + '/api.php';

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
    var normName = '', token = '';
    var tp = 'Template:';
    var form = '<div style="float: left;"><form action="#">' +
      '<div style="clear: both; padding: 5px 0px 1.5em;">' +
      '<span class="weLabel">' +
      '<label for="name"><span style="color: red;">*</span> Name:' +
      '</label></span>' +
      '<input id="name" type="text" size="40" value="Template:" />' +
      '<span id="nameError" style="margin-left: 1em; color: red;"></span>' +
      '</div>' +
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
      '<textarea id="text" type="textarea" rows="10" cols="40" ' +
      ' style="width: 500px;">' +
      '</textarea></div>' +
      '<div style="clear: both; padding-top: 5px">' +
      '<span class="weLabel" style="color: red; font-size: smaller">' +
      '* required</span>' +
      '<input id="weInsectButton" type="submit" value="Create" ' +
      ' disabled />' +
      '</div>' +
      '</form></div>';
    $('.weAddInsectButtonSpinner').hide();
    $('.weAddInsectButton').hide();
    $('<div id="weDialog" style="display:none">' + form + "</div>\n")
      .appendTo('body');
    $('span.weLabel').css({'width': '120px', 'padding-right': '15px',
      'float': 'left', 'text-align': 'right'});
    $('#name').blur(function() {
        var n = $.trim($(this).val());
        n = n.charAt(0).toUpperCase() + n.slice(1);
        $(this).val(n);
        if ((n === '') || (n === 'Template:')) {
          return;
        }
        mwAPI({
          action: 'query',
          prop: 'info',
          intoken: 'edit',
          titles: n
        }, function(d) {
          if (d.hasOwnProperty('query') &&
              d.query.hasOwnProperty('pages') &&
              d.query.pages.hasOwnProperty('-1')) {
            token = d.query.pages[-1].edittoken;
            // check if we are told a normalized name
            if (d.query.hasOwnProperty('normalized')) {
              normName = d.query.normalized[0].to;
            } else {
              normName = n;
            }
            $('#weInsectButton').val('Create ' + normName);
            $('#weInsectButton').removeAttr('disabled');
            $('#nameError').text('');
            $('#name').css('background', '');
          } else {
            token = '';   // revoke the token, just to be sure
            $('#nameError').text('already exists');
            $('#name').css('background', 'lightcoral');
          }
        });
        if (n.indexOf(tp) === 0) {
          n = n.substr(tp.length);
          n = n.charAt(0).toUpperCase() + n.slice(1);
          $(this).val(tp + n);
        }
        if ((n.length !== 0) && ($('#genus').val() === '')) {
          $('#genus').val(n.toLowerCase());
        }
      }).focus(function() {
        // disable the button, name is changing
        $('#weInsectButton').val('Create').attr('disabled', 'disabled');
      });
    $('#name').val($('#name').val());
    $('#name').focus();
    $('#weDialog').dialog({height: 580, width: 720, modal: true,
      resizable: true,
      title: 'Create a new insect template'});
    $('#weInsectButton').click(function() {
      var n = $.trim($('#name').val());
      n = n.charAt(0).toUpperCase() + n.slice(1);
      if ((n === '') || (n === tp)) {
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

      mwAPI({
        action: 'edit',
        title: normName,
        summary: 'new insect template',
        text: data,
        token: token,
        watchlist: 'watch'
        }, function (d) {
          $('#weDialog').dialog('close');
          window.location = wgServer + '/' + encodeURIComponent(normName);
        }, function(hdr, stat, err) {
          alert("Unable to save new insect!\n" + stat);
        });
      });
  }
  var addButton = '<input type="submit" ' +
    'value="You must be logged in to add an insect" disabled="disabled">';
  if (wgUserName !== null) {
    addButton = '<input type="submit" class="weAddInsectButton" ' +
      'value="Add an Insect" />';
  }
  $('.weInsectAdd').append(addButton);
  $('.weAddInsectButton').click(function() {
    $('.weAddInsectButton').attr('disabled', 'disabled');
    showForm();
  });
}());

