form = [
  name: 'activity'
  label: 'E-Activity:'
  type: 'select'
  req: true
  err: 'Please indicate the E-Activity you have completed.'
  options: [
    ""
    "1st learning reflection"
    "Activity 3.1"
    "Activity 4.1"
    "2nd learning reflection"
    "3rd learning reflection"
  ]
 ,
   name: 'url'
   label: 'URL:'
   type: 'text'
   req: true
   note: 'Provide the URL to the specific blog post.'
   err: 'Please provide the URL to the specific blog post.'
 ,
   name: 'title'
   label: 'Title:'
   type: 'text'
   req: true
   err: 'Please enter the title of the post.'
 ,
   name: 'comment'
   label: 'Comment:'
   type: 'textarea'
   req: true
   err: 'Please provide a brief comment about the E-Activity.'
]
formtitle = 'Add to table'
rform = {}
autorow = []
automode = false
bottom = false
tid = ''

entityMap =
  "&": "&amp;"
  "<": "&lt;"
  ">": "&gt;"
  '"': '&quot;'
  "'": '&#39;'
  "/": '&#x2F;'

escapeHTML = (s) ->
  return String(s).replace(/[&<>"'\/]/g, (s) ->
    entityMap[s])

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

formElement = (x, ix) ->
  r = "<td class=\"mw-label\"><label for=\"WErb#{ix}\">#{x.label}</label></td>"

  ni = "name=\"WErb#{ix}\" id=\"WErb#{ix}\""
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
  if bottom
    p = text.indexOf('|}', text.indexOf('id="#{tid}"'))
  else
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
  ix = 0
  for element in form
    $es = $("#WErb#{ix}")
    v = $.trim($es.val())
    #console.log(element.name, v)
    if element.req and v is ""
      $es.next().text(element.err).css('color', 'FireBrick')
      err = true
    else
      $es.next().html('&nbsp;')
      rform[element.name] = v
      autorow.push(v)
    ix++
  if err
    return false
  # hide submit, show spinner
  $('#weAddToTableSubmit').hide()
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
        if rform.activity
          summary = "Add #{rform.activity}"
        else
          summary = "add item"
        api
          action: 'edit'
          title: window.wgPageName
          summary: summary
          text: insertRow(text, row)
          token: token
          unwatch: 1
          (d) ->
            #console.log('saved!')
            window.location = "#{window.wgServer}/#{window.wgPageName}?1"
          ->
            alert("Unable to save row.  Please try later.")
            window.location = "#{window.wgServer}/#{window.wgPageName}?1"
        if rform.comment
          comment = abridge(rform.comment)
        ###
        api
          action: 'wenotes'
          notag: 'oeruesp'
          notext: "New #{rform.sport} (#{rform.focus}) resource: #{rform.title} #{rform.url} #{comment}"
          ->
            t = 1
          ->
            t = 2
        ###
        break
    ->
      pass = 1
  if automode
    console.log('autorow', autorow);
    row = autorow.slice(0)
    row.unshift("\n|-")
  else
    row = []
    row.push("\n|-")
    # make sure the URL starts with https?://
    url = rform.url
    if not /^https?:\/\//i.exec(url)
      url = "http://#{url}"
    row.push("[[User:#{rform.user}|#{rform.user_name}]]")
    row.push(rform.activity)
    row.push("[#{url} #{rform.title}]")
    row.push(rform.comment)
    row.push("\n")
  row = row.join("\n|") + "\n";
  console.log('row=', row)
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
  $('#weAddToTableDialog').dialog(
    height: 400
    width: 680
    title: escapeHTML(formtitle)
    show: 'slow')
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

weAddToTable = (id, options) ->
  login = options.login || 'Login to add to the table'
  button = options.button || 'Add to table'
  formtitle = options.formtitle || 'Add to table'
  $did = $("#b#{id}")
  if window.wgUserName
    $did.append("<button></button>")
    $did.find('button').text(button)
  else
    $did.html("<a href=\"http://wikieducator.org/index.php?title=Special:UserLogin&returnto=#{window.wgPageName}\"></a>");
    $did.find('a').text(login)
    return false
  tid = id
  if options.bottom
    bottom = true
  if options.auto
    automode = true
    form = []
    $("##{id}").find("th").each ->
      heading = $(this).text()
        .replace(/[\n\t\xA0]/g, ' ')
      heading = $.trim(heading);
      type = 'text'
      if heading.indexOf('*') > -1
        heading = heading.replace(/[*]/g, '')
        type = 'textarea'
      formitem =
        name: escape(heading)
        label: escapeHTML(heading)
        type: type
      form.push(formitem)
  $('body').append("""
  <div id="weAddToTableDialog" style="display:none;">
    <form id="fweAddToTable#{id}">
      <table></table>
    </form>
  </div>
  """)
  console.log form
  ix = 0;
  for element in form
    do (element, ix) ->
      $("#weAddToTableDialog > form > table").append('<tr>' +
        formElement(element, ix) + "</tr>\n");
    ix++
  $('#weAddToTableDialog > form > table').append('''
  <tr><td>&nbsp;</td>
    <td><img id="WErbSpinner" src="/skins/common/images/Ajax-loader.gif"
          height=16 width=16 style="display: none" /><button
          id="weAddToTableSubmit">Submit</button></td></tr>
  ''')
  $did.find('button').click(showForm)
  $('#weAddToTableSubmit').click(submitForm)
  return false

jQuery ->
  window.weAddToTable = weAddToTable
  return

