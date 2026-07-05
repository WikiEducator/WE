/*
  Google HTML5 slides template

  Authors: Luke Mahé (code)
           Marcin Wichary (code and design)

           Dominic Mazzoni (browser compatibility)
           Charles Chen (ChromeVox support)

  URL: http://code.google.com/p/html5slides/
*/

var PERMANENT_URL_PREFIX = 'http://html5slides.googlecode.com/svn/trunk/';

var SLIDE_CLASSES = ['far-past', 'past', 'current', 'next', 'far-next'];

var PM_TOUCH_SENSITIVITY = 15;

var curSlide;

if ((typeof console === 'undefined') || (typeof console.log === 'undefined')) {
  console = {};
  console.log = function (msg) { alert(msg); };
}

/* ---------------------------------------------------------------------- */
/* classList polyfill by Eli Grey 
 * (http://purl.eligrey.com/github/classList.js/blob/master/classList.js) */

if (typeof document !== "undefined" && !("classList" in document.createElement("a"))) {

(function (view) {

var
    classListProp = "classList"
  , protoProp = "prototype"
  , elemCtrProto = (view.HTMLElement || view.Element)[protoProp]
  , objCtr = Object
    strTrim = String[protoProp].trim || function () {
    return this.replace(/^\s+|\s+$/g, "");
  }
  , arrIndexOf = Array[protoProp].indexOf || function (item) {
    for (var i = 0, len = this.length; i < len; i++) {
      if (i in this && this[i] === item) {
        return i;
      }
    }
    return -1;
  }
  // Vendors: please allow content code to instantiate DOMExceptions
  , DOMEx = function (type, message) {
    this.name = type;
    this.code = DOMException[type];
    this.message = message;
  }
  , checkTokenAndGetIndex = function (classList, token) {
    if (token === "") {
      throw new DOMEx(
          "SYNTAX_ERR"
        , "An invalid or illegal string was specified"
      );
    }
    if (/\s/.test(token)) {
      throw new DOMEx(
          "INVALID_CHARACTER_ERR"
        , "String contains an invalid character"
      );
    }
    return arrIndexOf.call(classList, token);
  }
  , ClassList = function (elem) {
    var
        trimmedClasses = strTrim.call(elem.className)
      , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
    ;
    for (var i = 0, len = classes.length; i < len; i++) {
      this.push(classes[i]);
    }
    this._updateClassName = function () {
      elem.className = this.toString();
    };
  }
  , classListProto = ClassList[protoProp] = []
  , classListGetter = function () {
    return new ClassList(this);
  }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
  return this[i] || null;
};
classListProto.contains = function (token) {
  token += "";
  return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function (token) {
  token += "";
  if (checkTokenAndGetIndex(this, token) === -1) {
    this.push(token);
    this._updateClassName();
  }
};
classListProto.remove = function (token) {
  token += "";
  var index = checkTokenAndGetIndex(this, token);
  if (index !== -1) {
    this.splice(index, 1);
    this._updateClassName();
  }
};
classListProto.toggle = function (token) {
  token += "";
  if (checkTokenAndGetIndex(this, token) === -1) {
    this.add(token);
  } else {
    this.remove(token);
  }
};
classListProto.toString = function () {
  return this.join(" ");
};

if (objCtr.defineProperty) {
  var classListPropDesc = {
      get: classListGetter
    , enumerable: true
    , configurable: true
  };
  try {
    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
  } catch (ex) { // IE 8 doesn't support enumerable:true
    if (ex.number === -0x7FF5EC54) {
      classListPropDesc.enumerable = false;
      objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    }
  }
} else if (objCtr[protoProp].__defineGetter__) {
  elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

}
/* ---------------------------------------------------------------------- */

/* Slide movement */

function getSlideEl(no) {
  if ((no < 0) || (no >= slideEls.length)) { 
    return null;
  } else {
    return slideEls[no];
  }
};

function updateSlideClass(slideNo, className) {
  var el = getSlideEl(slideNo);
  
  if (!el) {
    return;
  }
  
  if (className) {
    el.classList.add(className);
  }
    
  for (var i in SLIDE_CLASSES) {
    if (className != SLIDE_CLASSES[i]) {
      el.classList.remove(SLIDE_CLASSES[i]);
    }
  }
};

function updateSlides() {
  for (var i = 0; i < slideEls.length; i++) {
    switch (i) {
      case curSlide - 2:
        updateSlideClass(i, 'far-past');
        break;
      case curSlide - 1:
        updateSlideClass(i, 'past');
        break;
      case curSlide: 
        updateSlideClass(i, 'current');
        break;
      case curSlide + 1:
        updateSlideClass(i, 'next');      
        break;
      case curSlide + 2:
        updateSlideClass(i, 'far-next');      
        break;
      default:
        updateSlideClass(i);
        break;
    }
  }

  triggerLeaveEvent(curSlide - 1);
  triggerEnterEvent(curSlide);

  window.setTimeout(function() {
    // Hide after the slide
    disableSlideFrames(curSlide - 2);
  }, 301);

  enableSlideFrames(curSlide - 1);
  enableSlideFrames(curSlide + 2);
  
  if (isChromeVoxActive()) {
    speakAndSyncToNode(slideEls[curSlide]);
  }  

  updateHash();
};

function buildNextItem() {
  //var toBuild  = slideEls[curSlide].querySelectorAll('.to-build');
  var toBuild = $('.to-build', slideEls[curSlide]);

  if (!toBuild.length) {
    return false;
  }

  toBuild[0].classList.remove('to-build');

  if (isChromeVoxActive()) {
    speakAndSyncToNode(toBuild[0]);
  }

  return true;
};

function exitSlide() {
  window.location = wgServer + '/' + wgPageName;
  return false;
};

function prevSlide() {
  if (curSlide > 0) {
    curSlide--;

    updateSlides();
  } else {
    $('#prev-slide-icon').fadeOut('fast').unbind('click');
  }
};

function nextSlide() {
  if (buildNextItem()) {
    return;
  }

  if (curSlide < slideEls.length - 1) {
    curSlide++;

    updateSlides();
  } else {
    $('#next-slide-icon').fadeOut('fast').unbind('click');
  }
};

/* Slide events */

function triggerEnterEvent(no) {
  return;
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var onEnter = el.getAttribute('onslideenter');
  if (onEnter) {
    new Function(onEnter).call(el);
  }

  var evt = document.createEvent('Event');
  evt.initEvent('slideenter', true, true);
  evt.slideNumber = no + 1; // Make it readable

  el.dispatchEvent(evt);
};

function triggerLeaveEvent(no) {
  return;
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var onLeave = el.getAttribute('onslideleave');
  if (onLeave) {
    new Function(onLeave).call(el);
  }

  var evt = document.createEvent('Event');
  evt.initEvent('slideleave', true, true);
  evt.slideNumber = no + 1; // Make it readable
  
  el.dispatchEvent(evt);
};

/* Touch events */

function handleTouchStart(event) {
  var e = event.originalEvent;
  if (e.touches.length == 1) {
    touchDX = 0;
    touchDY = 0;

    touchStartX = e.touches[0].pageX;
    touchStartY = e.touches[0].pageY;

    //document.body.addEventListener('touchmove', handleTouchMove, true);
    //document.body.addEventListener('touchend', handleTouchEnd, true);
    $('body').bind('touchmove', handleTouchMove);
    $('body').bind('touchend', handleTouchEnd);
  }
};

function handleTouchMove(event) {
  var e = event.originalEvent;
  if (e.touches.length > 1) {
    cancelTouch();
  } else {
    touchDX = e.touches[0].pageX - touchStartX;
    touchDY = e.touches[0].pageY - touchStartY;
  }
};

function handleTouchEnd(event) {
  var e = event.originalEvent;
  var dx = Math.abs(touchDX);
  var dy = Math.abs(touchDY);

  if ((dx > PM_TOUCH_SENSITIVITY) && (dy < (dx * 2 / 3))) {
    if (touchDX > 0) {
      prevSlide();
    } else {
      nextSlide();
    }
  }
  
  cancelTouch();
};

function cancelTouch() {
  //document.body.removeEventListener('touchmove', handleTouchMove, true);
  //document.body.removeEventListener('touchend', handleTouchEnd, true);  
  $('body').unbind('touchmove');
  $('body').unbind('touchend');
};

/* Preloading frames */

function disableSlideFrames(no) {
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var frames = el.getElementsByTagName('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    disableFrame(frame);
  }
};

function enableSlideFrames(no) {
  var el = getSlideEl(no);
  if (!el) {
    return;
  }

  var frames = el.getElementsByTagName('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    enableFrame(frame);
  }
};

function disableFrame(frame) {
  frame.src = 'about:blank';
};

function enableFrame(frame) {
  var src = frame._src;

  if (frame.src != src && src != 'about:blank') {
    frame.src = src;
  }
};

function setupFrames() {
  var frames = document.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    frame._src = frame.src;
    disableFrame(frame);
  }
  
  enableSlideFrames(curSlide);
  enableSlideFrames(curSlide + 1);
  enableSlideFrames(curSlide + 2);  
};

function setupInteraction() {
  /* Clicking and tapping */
  
  $('.slides').append('<div class="slide-area" id="prev-slide-area"><img src="/extensions/WE/Slides/images/iconclose.gif" id="prev-slide-close" style="display: none; margin-left: 40px;"><br /><img src="/extensions/WE/Slides/images/iconprev.gif" id="prev-slide-icon" style="display:none; margin-left: 40px; margin-top:250px;"></div>');
  $('#prev-slide-area')
    .click(prevSlide)
    .hover(function() {
        $('#prev-slide-close').fadeIn('fast').click(exitSlide);
        if (curSlide > 0) {
          $('#prev-slide-icon').fadeIn('fast');
        }
      },
      function() {
        $('#prev-slide-close').fadeOut('fast').unbind('click');
        $('#prev-slide-icon').fadeOut('fast');
      });;
  $('.slides').append('<div class="slide-area" id="next-slide-area"><img src="/extensions/WE/Slides/images/iconnext.gif" id="next-slide-icon" style="display:none; margin-left: 60px; margin-top:298px;"></div>');
  $('#next-slide-area')
    .click(nextSlide)
    .hover(function() {
        if (curSlide < slideEls.length -1) {
          $('#next-slide-icon').fadeIn('fast');
        }
      },
      function() {
        $('#next-slide-icon').fadeOut('fast');
      });;
  /*
  var el = document.createElement('div');
  el.className = 'slide-area';
  el.id = 'prev-slide-area';  
  el.addEventListener('click', prevSlide, false);
  document.querySelector('section.slides').appendChild(el);

  var el = document.createElement('div');
  el.className = 'slide-area';
  el.id = 'next-slide-area';  
  el.addEventListener('click', nextSlide, false);
  document.querySelector('section.slides').appendChild(el);  
  */

  /* Swiping */
  
  //document.body.addEventListener('touchstart', handleTouchStart, false);
  $('body').bind('touchstart', handleTouchStart);
}

/* ChromeVox support */

function isChromeVoxActive() {
  if (typeof(cvox) == 'undefined') {
    return false;
  } else {
    return true;
  }
};

function speakAndSyncToNode(node) {
  if (!isChromeVoxActive()) {
    return;
  }
  
  cvox.ChromeVox.navigationManager.switchToStrategy(
      cvox.ChromeVoxNavigationManager.STRATEGIES.LINEARDOM, 0, true);  
  cvox.ChromeVox.navigationManager.syncToNode(node);
  cvox.ChromeVoxUserCommands.finishNavCommand('');
  var target = node;
  while (target.firstChild) {
    target = target.firstChild;
  }
  cvox.ChromeVox.navigationManager.syncToNode(target);
};

function speakNextItem() {
  if (!isChromeVoxActive()) {
    return;
  }
  
  cvox.ChromeVox.navigationManager.switchToStrategy(
      cvox.ChromeVoxNavigationManager.STRATEGIES.LINEARDOM, 0, true);
  cvox.ChromeVox.navigationManager.next(true);
  if (!cvox.DomUtil.isDescendantOfNode(
      cvox.ChromeVox.navigationManager.getCurrentNode(), slideEls[curSlide])){
    var target = slideEls[curSlide];
    while (target.firstChild) {
      target = target.firstChild;
    }
    cvox.ChromeVox.navigationManager.syncToNode(target);
    cvox.ChromeVox.navigationManager.next(true);
  }
  cvox.ChromeVoxUserCommands.finishNavCommand('');
};

function speakPrevItem() {
  if (!isChromeVoxActive()) {
    return;
  }
  
  cvox.ChromeVox.navigationManager.switchToStrategy(
      cvox.ChromeVoxNavigationManager.STRATEGIES.LINEARDOM, 0, true);
  cvox.ChromeVox.navigationManager.previous(true);
  if (!cvox.DomUtil.isDescendantOfNode(
      cvox.ChromeVox.navigationManager.getCurrentNode(), slideEls[curSlide])){
    var target = slideEls[curSlide];
    while (target.lastChild){
      target = target.lastChild;
    }
    cvox.ChromeVox.navigationManager.syncToNode(target);
    cvox.ChromeVox.navigationManager.previous(true);
  }
  cvox.ChromeVoxUserCommands.finishNavCommand('');
};

/* Hash functions */

function getCurSlideFromHash() {
  var slideNo = parseInt(location.hash.substr(1));

  if (slideNo) {
    curSlide = slideNo - 1;
  } else {
    curSlide = 0;
  }
};

function updateHash() {
  location.replace('#' + (curSlide + 1));
};

/* Event listeners */

function handleBodyKeyDown(event) {
  var k = event.keyCode;
  //switch (event.keyCode) {
  switch (k) {
    case 39: // right arrow
    case 13: // Enter
    case 32: // space
    case 34: // PgDn
      nextSlide();
      event.preventDefault();
      break;

    case 37: // left arrow
    case 8: // Backspace
    case 33: // PgUp
      prevSlide();
      event.preventDefault();
      break;

    case 40: // down arrow
      if (isChromeVoxActive()) {
        speakNextItem();
      } else {
        nextSlide();
      }
      event.preventDefault();
      break;

    case 38: // up arrow
      if (isChromeVoxActive()) {
        speakPrevItem();
      } else {
        prevSlide();
      }
      event.preventDefault();
      break;

    case 35: // end
      curSlide = slideEls.length - 1;
      updateSlides();
      event.preventDefault();
      break;

    case 36: // home
      curSlide = 0;
      updateSlides();
      event.preventDefault();
      break;

    case 27: // Esc
      $('body').empty();  // fast feedback that something is happening
      //console.log('window.location=' + wgServer + '/' + wgPageName);
      // try delaying this call to see if Firefox honors it this way
      setTimeout(function() {
        window.location = wgServer + '/' + wgPageName;
        return false;
        }, 100);
      break;

    /*
    default:
      console.log('keycode=',k);
      event.preventDefault();
      break;
    */
  }
};

function doRedirect() {
}

function addEventListeners() {
  // document.addEventListener('keydown', handleBodyKeyDown, false);
  $(document).keydown(handleBodyKeyDown);
};

/* Initialization */

function addPrettify() {
  var els = document.querySelectorAll('pre');
  for (var i = 0, el; el = els[i]; i++) {
    if (!el.classList.contains('noprettyprint')) {
      el.classList.add('prettyprint');
    }
  }
  
  var el = document.createElement('script');
  el.type = 'text/javascript';
  el.src = PERMANENT_URL_PREFIX + 'prettify.js';
  el.onload = function() {
    prettyPrint();
  }
  document.body.appendChild(el);
};

function addFontStyle() {
  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.type = 'text/css';
  el.href = 'http://fonts.googleapis.com/css?family=' +
            'Open+Sans:regular,semibold,italic,italicsemibold|Droid+Sans+Mono';

  document.body.appendChild(el);
};

function addGeneralStyle() {
  /*
  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.type = 'text/css';
  el.href = PERMANENT_URL_PREFIX + 'styles.css';
  document.body.appendChild(el);
  */
  var href = wgServer + '/extensions/WE/Slides/slides.css?q=' + Math.random();
  $('head').append('<link rel="stylesheet" type="text/css" href="' + href + '" />');

  /*
  var el = document.createElement('meta');
  el.name = 'viewport';
  el.content = 'width=1100,height=750';
  document.querySelector('head').appendChild(el);
  */
  $('head').append('<meta name="viewport" content="width=1100,height=750" />');

  /*
  var el = document.createElement('meta');
  el.name = 'apple-mobile-web-app-capable';
  el.content = 'yes';
  document.querySelector('head').appendChild(el);
  */
  $('head').append('<meta name="apple-mobile-web-app-capable" content="yes" />');
};

function addLogo() {
  var img = $('#weSlideLogo').filter(':first');
  var href = $('#weSlideLogo img').filter(':first').attr('src');
  if (href) {
    var style= '.slides.template-default > div.slide:not(.nobackground):not(.biglogo) {';
    style += 'background: url(' + href + ') 98% 98% no-repeat;';
    style += 'background-color: white; }\n'; 

    style += '.slides.template-default > div.slide {';
    style += 'background: url(' + href + ') 98% 98% bottom no-repeat;';
    style += 'background-color: white; }\n'; 
    $('head').append('<style type="text/css">/*<![CDATA[*/ ' + style + '/*]]>*/</style>');
  }
}

function makeBuildLists() {
  $('.build li').addClass('to-build');
  /*
  for (var i = curSlide, slide; slide = slideEls[i]; i++) {
    var items = slide.querySelectorAll('.build > *');
    for (var j = 0, item; item = items[j]; j++) {
      if (item.classList) {
        item.classList.add('to-build');
      }
    }
  }
  */
};

function toSeconds(t) {
  var i, parts;
  var seconds = 0;
  parts = t.split(':');
  for (i = 0; i < parts.length; i++) {
    seconds *= 60;
    seconds += parseInt(parts[i], 10);
  }
  return seconds;
}

$(function () {
  getCurSlideFromHash();

  $('span.editsection').hide();
  slideEls = $('.slides > div.slide');
  addLogo();

  // setupFrames();

  addFontStyle();
  addGeneralStyle();
  //addPrettify();
  addEventListeners();

  // remove some wikiness
  $('#toc').remove();
  var WEslides = $('div.slides').detach();
  var narration = $('#narrationdiv').detach();
  $('body').empty();
  WEslides.appendTo('body');
  narration.appendTo('body');

  // try to fix up pedagogical templates by demoting h1 to h4
  $('.eXe-iDevice h1').each(function() {
    var h4 = $('<h4></h4>').append($(this).contents());
    $(this).replaceWith(h4);
  });

  updateSlides();

  setupInteraction();
  makeBuildLists();

  // make images that link to File: pages unclickable
  $('a.image').each(function() {
    if ($(this).attr('href').lastIndexOf('/File:', 0) === 0) {
      $(this).click(function() {return false;});
    }
  });

  $('#narrationdiv').css({float: 'none', position: 'fixed', display: 'block', bottom: '0', 'z-index': 150, 'margin-left': 'auto', 'margin-right': 'auto'});
  $('body').addClass('loaded');
  $.getScript("http://popcornjs.org/code/dist/popcorn-complete.min.js", function() {
    function goSlide(s) {
      curSlide = s;
      updateSlides();
    }
    function goBuild(b) {
    }
    console.log('popcorn loaded');
    var pop = Popcorn('#narration');
    var cues = [];
    $('div.slide').each(function(i) {
      var id = $(this).attr('id');
      if (id && (id.indexOf("Wa_") === 0)) {
        console.log('id='+id);
        var times = id.substring(3).split('-');
        var time = toSeconds(times[0]);
        cues.push(time);
        console.log('slide ' + i + ' ' + time);
        pop.cue(time, function() {goSlide(i);});
        for (var j=1; j<times.length; j++) {
          time = toSeconds(times[j]);
          console.log(' bldg ' + j + ' ' + time);
          pop.cue(time, function() {buildNextItem();});
        }
      }
    });
    /*
    pop.cue(0, function() {goSlide(0);});
    pop.cue(8, function() {goSlide(1);});
    pop.cue(11, function() {goSlide(2);});
    pop.cue(16, function() {goSlide(3);});
    pop.cue(17, function() {buildNextItem();});
    pop.cue(18, function() {buildNextItem();});
    pop.cue(19, function() {buildNextItem();});
    pop.cue(20, function() {goSlide(4);});
    pop.cue(24, function() {goSlide(5);});
    pop.cue(27, function() {goSlide(6);});
    pop.cue(30, function() {goSlide(7);});
    pop.cue(34, function() {goSlide(8);});
    pop.cue(38, function() {goSlide(9);});
    */
    pop.play();
  });
});

