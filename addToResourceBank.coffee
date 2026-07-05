form = [
  name: 'topic'
  label: 'Topic:'
  type: 'text'
  req: true
  err: 'Please indicate the focus of the resource.'
 ,
   name: 'context'
   label: 'Context:'
   type: 'text'
   req: true
   err: 'Please specify the context of the resource.'
 ,
   name: 'url'
   label: 'URL:'
   type: 'text'
   req: true
   err: 'Please provide the public URL to the resource.'
 ,
   name: 'title'
   label: 'Title:'
   type: 'text'
   req: true
   err: 'Please enter the title of the resource.'
 ,
   name: 'pubdate'
   label: 'Publication Date:'
   type: 'text'
   req: true
   err: 'Please enter the first publication year of the resource.'
 ,
   name: 'comment'
   label: 'Comment:'
   type: 'textarea'
   req: true
   err: 'Please provide a brief comment about the resource.'
]
rform = {}
tid = ''

api = (data, success, failure) ->
  data.action ||= 'query'
  data.format ||= 'json'
  $.ajax(
    url: window.wgServer + '/api.php'
    type: 'POST'
    data: data
    success: success
    failure: failure
  )

formElement = (x) ->
  r = "<td class=\"mw-label\"><label for=\"WErb#{x.name}\">#{x.label}</label></td>"

  ni = "name=\"WErb#{x.name}\" id=\"WErb#{x.name}\""
  switch x.type
    when "select"
      r += '<td class="mw-input"><select ' + ni + '>'
      for o in x.options
        if typeof o is 'string'
          [v, t, text, selected, disabled] = [o, o, o, false, false]
        else
          [v, t, text, selected, disabled] = [o.value, o.title, o.text, o.selected, o.disabled]
        r += "<option value=\"#{v}\" title=\"#{t}\""
        r += ' disabled="disabled"' if disabled
        r += ' selected' if selected
        r += ">#{text}</option>"
      r += "</select>
            <div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"
    when "textarea"
      r += "<td class=\"mw-input\"><textarea #{ni} rows=2 cols=40></textarea><div style=\"font-size:smaller;\">#{x.note||'&nbsp;'}</div></td>"
    else
      r += "<td class=\"mw-input\"><input #{ni} type=\"text\" size=\"40\""
      r += ' disabled="disabled"' if x.disabled
      r += " /><div style=\"font-size: smaller;\">#{x.note||'&nbsp;'}</div></td>"

abridge = (text) ->
  maxlen = 150
  if text.length > maxlen
    p = maxlen
    while p > 1 && text.charAt(p) isnt ' '
      p--
    text = text.slice(0, p-1)
  return text

insertRow = (text, row) ->
  p = text.indexOf('|-', text.indexOf('id="#{tid}"'))
  if p > 0
    start = text.slice(0, p-1)
    end = text.slice(p)
    #console.log("start:", start)
    #console.log("end:", end)
    return start + row + end
  return ''

submitForm = ->
  err = false
  for element in form
    $es = $("#WErb#{element.name}")
    v = $.trim($es.val())
    #console.log(element.name, v)
    if element.req and v is ""
      $es.next().text(element.err).css('color', 'FireBrick')
      err = true
    else
      $es.next().html('&nbsp;')
      rform[element.name] = v
  #console.log(rform)
  if err
    return false
  # hide submit, show spinner
  $('#weAddToResourceBankSubmit').hide()
  $('#WErbSpinner').show()
  # request page and edit token
  api
    prop: 'info|revisions'
    intoken: 'edit'
    rvprop: 'content'
    titles: window.wgPageName
    (d) ->
      #console.log(d)
      pages = d?.query?.pages
      for p of pages
        token = pages[p].edittoken
        #console.log('token=', token)
        text = pages[p].revisions[0]['*']
        #console.log(text)
        api
          action: 'edit'
          title: window.wgPageName
          summary: "Add #{rform.context} resource"
          text: insertRow(text, row)
          token: token
          unwatch: 1
          (d) ->
            #console.log('saved!')
            window.location = "#{window.wgServer}/#{window.wgPageName}?1"
          ->
            alert("Unable to save resource.  Please try later.")
            window.location = "#{window.wgServer}/#{window.wgPageName}?1"
        comment = abridge(rform.comment)
        api
          action: 'wenotes'
          notag: 'oeruesp'
          notext: "New #{rform.context} (#{rform.topic}) resource: #{rform.title} #{rform.url} #{comment}"
          ->
            t = 1
          ->
            t = 2
        break
    ->
      pass = 1
  row = []
  row.push("\n|-")
  row.push('   0<br />&#x2606;')
  row.push(rform.topic)
  row.push(rform.context)
  row.push("[#{rform.url} #{rform.title}]. #{rform.pubdate}.")
  row.push(rform.comment)
  row.push("[[User:#{rform.user}|#{rform.user_name}]]\n")
  row = row.join("\n|")
  #console.log('row', row)
  # find table
  # insert row
  # save
  # if successful redirect
  return false

showForm = ->
  ###
  if window.wgUserName is null
    alert("You must be logged in to WikiEducator to add an entry")
    return false
  ###
  $('#weAddToResourceBankDialog').dialog({height: 500, width: 680, title: 'Add to Resource Bank', show: 'slow'})
  getUserName()
  return false

getUserName = ->
  #console.log('API request for realname')
  rform.user = window.wgUserName
  api
    meta: 'userinfo'
    uiprop: 'realname'
    (d) ->
      #console.log(d)
      if d.query?.userinfo
        userinfo = d.query.userinfo
        rform.user_name = userinfo.realname
        #console.log(rform.user_name)

weAddToResourceBank = (id, login, button) ->
  $did = $("#b#{id}")
  if window.wgUserName
    $did.append("<button></button>")
    $did.find('button').text(button)
  else
    $did.html('<a href="http://wikieducator.org/index.php?title=Special:UserLogin&returnto=#{window.wgPageName}"></a>');
    $did.find('a').text(login)
    return false
  tid = id
  $('body').append("""
  <div id="weAddToResourceBankDialog" style="display:none;">
    <form id="fweAddToResourceBank#{id}">
      <table></table>
    </form>
  </div>
  """)
  for element in form
    do (element) ->
      $("#weAddToResourceBankDialog > form > table").append('<tr>' +
        formElement(element) + "</tr>\n");
  $('#weAddToResourceBankDialog > form > table').append('''
  <tr><td>&nbsp;</td>
    <td><img id="WErbSpinner" src="/skins/common/images/Ajax-loader.gif"
          height=16 width=16 style="display: none" /><button
          id="weAddToResourceBankSubmit">Submit</button></td></tr>
  ''')
  $did.find('button').click(showForm)
  $('#weAddToResourceBankSubmit').click(submitForm)
  return false

jQuery ->
  window.weAddToResourceBank = weAddToResourceBank
  return

