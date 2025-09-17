var RARU = RARU || {}
RARU.SHARED = {}

RARU.UTILS = {
  closest: function(node, selector) {
    return (node.closest || function(_selector) {
      do {
        // nodeã¨selectorãŒãƒžãƒƒãƒã—ãŸã‚‰è¿”ã™
        if ((node.matches || node.msMatchesSelector).call(node, _selector)) {
          return node;
        }
        // ãƒžãƒƒãƒã—ãªã‹ã£ãŸã‚‰è¦ªè¦ç´ ã‚’ä»£å…¥
        node = node.parentElement || node.parentNode;
      } while (node !== null && node.nodeType === 1);

      return null;
    }).call(node, selector);
  },
  loopElements: function(elements, callback) {
    for (var i = 0; i < elements.length; i++) {
      callback(elements[i], i)
    }
  },
  request: function(method, url, body) {
    var xhr = new XMLHttpRequest()
    xhr.open(method, url)
    xhr.send(body)
  },
  getQuery: function (key) {
    var result = null

    if (!location.search) return result
    var querySets = location.search.slice(1).split('&').map(function (v) {
      return v.split('=')
    })

    for (var i = 0; i < querySets.length; i++) {
      if (querySets[i][0] === key) {
        result = decodeURIComponent(querySets[i][1])
      }
    }
    return result
  }
}

var throttle = (function(callback, interval = 128) {
  var time = Date.now(),
      lag,
      debounceTimer,
      debounceDelay = 16;

  return function(callback) {
    lag = time + interval - Date.now();
    if (lag < 0) {
      //console.log( time + "ï¼šthrottleï¼š" + lag);
      callback();
      time = Date.now();
    } else {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        //console.log( time + "ï¼šdebounceï¼š" + (interval - lag + debounceDelay));
        callback();
      }, (interval - lag + debounceDelay));
    }
  }
})();

RARU.SHARED.HOME_MV_SLIDER = {
  SLIDE_CHANGE_MS: 3200,
  init: function () {
    if (!this.setParams()) return
    this.bindEvents()
  },
  setParams: function () {
    this.currentIndex = 0
    this.elMv = document.querySelector('.jsc-mv')
    if (!this.elMv) return false
    this.elMvList = document.querySelector('.jsc-mv-list')
    this.elMvControl = document.querySelector('.jsc-mv-control')
    this.elMvItems = this.elMvList.querySelectorAll('li')
    return true
  },
  bindEvents: function () {
    var _self = this
    this.passedMs = 0
    var INTERVAL_MS = 10
    var isActiveWindow = true

    window.addEventListener('blur', function () {
      isActiveWindow = false
    })
    window.addEventListener('focus', function () {
      isActiveWindow = true
    })
    if (this.elMvControl) {
      RARU.UTILS.loopElements(this.elMvControl.children, function (el, index) {
        el.addEventListener('click', function (e) {
          e.preventDefault()
          _self.slideNext(index)
          _self.passedMs = 0
        })
      })
    }

    RARU.UTILS.loopElements(this.elMvItems, function (el) {
      var touchStartX = 0
      var handleSwipe = function (diff) {
        if (diff > 0 && diff > 200) {
          _self.slideNext(_self.currentIndex === 0 ? _self.elMvItems.length - 1 : _self.currentIndex - 1)
          _self.passedMs = 0
        } else if (diff < 0 && diff < -200) {
          _self.slideNext()
          _self.passedMs = 0
        }
      }
      el.addEventListener('mousedown', function (e) {
        e.preventDefault()
        touchStartX = e.pageX
      })
      el.addEventListener('mouseup', function (e) {
        e.preventDefault()
        handleSwipe(e.pageX - touchStartX)
      })
      el.addEventListener('touchstart', function (e) {
        e.preventDefault()
        console.log(e)
        touchStartX = e.changedTouches[0].pageX
      })
      el.addEventListener('touchend', function (e) {
        e.preventDefault()
        handleSwipe(e.changedTouches[0].pageX - touchStartX)
      })
    })

    setInterval(function () {
      if (isActiveWindow) {
        _self.passedMs += INTERVAL_MS
        if (_self.passedMs >= _self.SLIDE_CHANGE_MS) {
          _self.slideNext()
          _self.passedMs = 0
        }
      }
    }, INTERVAL_MS)
    // this.slideNext()
  },
  slideNext: function (targetIndex = null) {
    var elMvList = this.elMvList

    if (targetIndex !== null) {
      this.currentIndex = targetIndex
    } else {
      if (this.currentIndex >= this.elMvItems.length - 1) {
        this.currentIndex = 0
      } else {
        this.currentIndex++
      }
    }

    RARU.UTILS.loopElements(this.elMvItems, function (el) {
      el.classList.remove('is-active')
    })
    this.elMvItems[this.currentIndex].classList.add('is-active')

    if (this.elMvControl) {
      RARU.UTILS.loopElements(this.elMvControl.children, function (el, i) {
        el.classList.remove('is-active')
      })
      this.elMvControl.children[this.currentIndex].classList.add('is-active')
    }

    setTimeout(function () {
      elMvList.classList.remove('pre')
    }, 2000)
  }
}

RARU.SHARED.INFINITE_SCROLL = function () {
  RARU.UTILS.request('GET', '/wp-json/wp/v2/get_custom_posts?post_type=talents&posts_per_page=2&offset=4')
  RARU.UTILS.request('GET', '/wp-json/wp/v2/get_custom_posts?post_type=topics&posts_per_page=2&offset=4')
}
RARU.SHARED.INFINITE_SCROLL.prototype = {}

RARU.SHARED.HOME_CONTROL = {
  init: function () {
    if (!this.setParams()) return
    this.bindEvents()
    this.toggleActive()
  },
  setParams: function () {
    this.currentIndex = 0
    this.elHtml = document.querySelector('html');
    if (!this.elHtml || !this.elHtml.classList.contains('home')) return false

    this.elNav = document.getElementById('jsi-nav')
    this.elScroller = document.getElementById('jsi-scroller')
    this.isActive = false
    return true
  },
  bindEvents: function () {
    var _self = this
    document.body.addEventListener('scroll', function () {})
    this.elScroller.addEventListener('scroll', function () {
      throttle(function () {
        _self.toggleActive()
      })
    })
  },
  toggleActive() {
    if (!this.elNav) return
    var navRect = this.elNav.getBoundingClientRect()

    var borderLine = window.innerWidth <= 767 ? window.innerHeight / 10 : window.innerHeight

    if (borderLine < this.elScroller.scrollTop) {
      if (this.isActive) return;
      this.elNav.classList.remove('is-absolute')
      this.isActive = true
    } else {
      if (!this.isActive) return;
      this.elNav.classList.add('is-absolute')
      this.isActive = false
    }
  },
}

RARU.SHARED.ABOUT_CONTROL = {
  init: function () {
    if (!this.setParams()) return
    this.bindEvents()
  },
  setParams: function () {
    this.elMv = document.getElementById('jsi-about-mv')
    if (!this.elMv) return
    this.elMvList = document.getElementById('jsi-about-mv-list')
    this.elMvControl = document.querySelector('.jsc-about-mv-dot-list')
    this.currentIndex = 0
    this.wheeldY = 0
    this.disabledHandler = false
    return true
  },
  bindEvents: function () {
    var _self = this
    this.elMv.addEventListener('wheel',   function (e) {
      _self.handleWheel(e)
    })

    var touchStartY = null
    this.elMv.addEventListener('touchstart',   function (e) {
      touchStartY = e.touches[0].clientY
    })
    this.elMv.addEventListener('touchmove',   function (e) {
      if (touchStartY === null) return
      var diff = e.touches[0].clientY - touchStartY

      if (diff > 50) {
        _self.slide(_self.currentIndex - 1)
        touchStartY = null
      } else if (diff < -50) {
        _self.slide(_self.currentIndex + 1)
        touchStartY = null
      }
    })
    RARU.UTILS.loopElements(this.elMvControl.children, function (el, index) {
      el.addEventListener('click', function (e) {
        e.preventDefault()
        _self.slide(index)
      })
    })
  },
  handleWheel: function (e) {
    e.preventDefault()
    e.stopPropagation()
    if (this.disabledHandler) return

    var _self = this
    var wheelDelta = typeof e.wheelDeltaY === 'number' ? e.wheelDeltaY : e.wheelDelta

    if (wheelDelta <= -1) {
      this.slide(this.currentIndex + 1)
    } else if (wheelDelta >= 1) {
      this.slide(this.currentIndex - 1)
    }
    this.disabledHandler = true

    setTimeout(function () {
      _self.disabledHandler = false
    }, 1500)
  },
  slide: function (index) {
    if (index < 0 || index >= this.elMvList.children.length) return;
    this.currentIndex = index

    RARU.UTILS.loopElements(this.elMvList.children, function (el) {
      el.classList.remove('is-active')
    })
    this.elMvList.children[this.currentIndex].classList.add('is-active')

    RARU.UTILS.loopElements(this.elMvControl.children, function (el) {
      el.classList.remove('is-active')
    })
    this.elMvControl.children[this.currentIndex].classList.add('is-active')
  }
}

RARU.SHARED.CONTACT_CONTROL = {
  init: function () {
    this.elContact = document.getElementById('jsi-contact')
    if (!this.elContact) return

    var jsonString = this.elContact.getAttribute('data-talent-names-all')
    var talentNamesAll = JSON.parse(jsonString || '[]')
    talentNamesAll.unshift('all')

    this.setupMultiSelect(this.elContact.querySelector('.jsc-multiple-select'), talentNamesAll, 1)
    this.controlType()
  },
  toggleTalentField: function (isActive) {
    var input = this.elContact.querySelector('[name="talent"]')
    var field = RARU.UTILS.closest(input, '.sju-field')
    if (!field) return

    if (isActive) {
      field.style.display = 'flex'
    } else {
      field.style.display = 'none'
    }
  },
  controlType: function () {
    var _self = this
    var typeRadios = this.elContact.querySelectorAll('[name="type"]')
    for (var i = 0; i < typeRadios.length; i++) {
      typeRadios[i].addEventListener('change', function (e) {
        console.log(e.target.value)
        if (e.target.checked && e.target.value === 'æ‰€å±žå¸Œæœ›') {
          _self.toggleTalentField(false)
        } else {
          _self.toggleTalentField(true)
        }
      })
    }
  },
  setupMultiSelect: function (el, options, number) {
    if (!el) return
    var input = el.querySelector('input')
    if (!input) return

    var selected = []

    var id = 'jsi-dropdown-' + number

    el.id = id
    input.setAttribute('readonly', '')

    var elOverlay = document.createElement('div')
    elOverlay.classList.add('sju-multiple-select-dropdown-overlay')

    var elDropdown = document.createElement('div')
    elDropdown.classList.add('sju-multiple-select-dropdown')
    elOverlay.appendChild(elDropdown)

    var elDropdownClose = document.createElement('i')
    elDropdownClose.classList.add('sju-multiple-select-dropdown-close')
    elDropdown.appendChild(elDropdownClose)

    var elDropdownList = document.createElement('ul')
    elDropdownList.classList.add('sju-multiple-select-dropdown-list')
    elDropdown.appendChild(elDropdownList)

    var frag = document.createDocumentFragment()
    for (var i = 0; i < options.length; i++) {
      var elOption = document.createElement('li')
      elOption.innerText = options[i]
      frag.appendChild(elOption)
    }
    elDropdownList.appendChild(frag)

    var elDropdownItems = elDropdownList.children

    el.appendChild(elOverlay)

    var updateInputValue = function () {
      for (var j = 0; j < elDropdownItems.length; j++) {
        var isActive = false
        for (var i = 0; i < selected.length; i++) {
          if (elDropdownItems[j].innerText === selected[i]) {
            isActive = true
          }
        }
        if (isActive) {
          elDropdownItems[j].classList.add('is-active')
        } else {
          elDropdownItems[j].classList.remove('is-active')
        }
      }
      Array.from(elDropdownList.children).forEach(function () {

      })
      input.value = selected.join('ã€')
    }

    input.addEventListener('click', function () {
      if (elDropdown.classList.contains('is-active')) {
        elOverlay.classList.remove('is-active')
      } else {
        elOverlay.classList.add('is-active')
      }
    })

    elDropdownList.addEventListener('click', function (e) {
      e.stopPropagation()
      e.preventDefault()
      if (e.target.tagName.toLowerCase() !== 'li') return
      var value = e.target.innerText

      var found = false
      for (var i = 0; i < selected.length; i++) {
        if (selected[i] === value) found = true
      }

      if (found) {
        selected = selected.filter(function (v) { return v !== value })
      } else {
        selected.push(value)
      }

      if (value === 'all') {
        if (!found) {
          selected = selected.filter(v => v === 'all')
        }
      } else {
        selected = selected.filter(v => v !== 'all')
      }

      updateInputValue()
    })

    document.addEventListener('click', function (e) {
      if (!RARU.UTILS.closest(e.target, '#' + id)) {
        elOverlay.classList.remove('is-active')
      }
    })
    elOverlay.addEventListener('click', function () {
      elOverlay.classList.remove('is-active')
    })
    elDropdownClose.addEventListener('click', function () {
      elOverlay.classList.remove('is-active')
    })

    var queryTalent = RARU.UTILS.getQuery('talent')
    if (queryTalent) {
      selected.push(queryTalent)
      updateInputValue()
    }
  }
}

RARU.SHARED.ENTRY_CONTROL = {
  init: function () {
    this.elEntry = document.getElementById('jsi-entry')
    if (!this.elEntry) return

    this.setupBirthdaySelect()

    var prefectures = document.querySelectorAll('.jsc-select-prefectures')
    for (var i = 0; i < prefectures.length; i++) {
      this.setupPrefectures(prefectures[i])
    }
    var files = document.querySelectorAll('.jsc-field-file')
    for (var l = 0; l < files.length; l++) {
      this.setupFile(files[l])
    }
  },
  setupBirthdaySelect: function () {
    var birthday = this.elEntry.querySelector('#jsi-birthday');
    if (!birthday) return;
    var year = birthday.querySelector('[name="birthYear"]')
    var month = birthday.querySelector('[name="birthMonth"]')
    var day = birthday.querySelector('[name="birthDay"]')
    var age = document.querySelector('[name="age"]')

    var addOptions = function (el, start, last, reversed = false) {
      var frag = document.createDocumentFragment()
      for (var i = 0; i <= last - start; i++) {
        var elOption = document.createElement('option')
        var value = reversed ? (last - i).toString() : (start + i).toString()
        elOption.innerText = value
        elOption.setAttribute('value', value)
        frag.appendChild(elOption)
      }
      el.appendChild(frag)
    }
    var addPlaceholder = function (el, label) {
      if (el.firstChild) {
        el.removeChild(el.firstChild)
      }
      var elOption = document.createElement('option')
      elOption.innerText = label
      elOption.setAttribute('value', '')
      elOption.setAttribute('disabled', 'disabled')
      elOption.setAttribute('selected', 'true')
      el.appendChild(elOption)
    }

    function getAge(birthDate) {
      var today = new Date();
      var age = today.getFullYear() - birthDate.getFullYear();
      console.log('age', age)
      birthDate.setFullYear(today.getFullYear())
      if(today < birthDate){
        age--;
      }

      return age;
    }

    var handleChange = function () {
      setTimeout(function () {
        if (day.value && month.value && year.value) {
          console.log(getAge(new Date(year.value, Number(month.value) - 1, day.value)))
          age.value = getAge(new Date(year.value, Number(month.value) - 1, day.value))
        }
      }, 300)
    }

    if (year) {
      addPlaceholder(year, 'å¹´')
      addOptions(year, new Date().getFullYear() - 100, new Date().getFullYear(), true)
      year.addEventListener('change', handleChange)
    }
    if (month) {
      addPlaceholder(month, 'æœˆ')
      addOptions(month, 1, 12)
    }
    if (day) {
      addPlaceholder(day, 'æ—¥')

      day.addEventListener('change', handleChange)
      month.addEventListener('change', function (e) {
        if (e.target.value) {
          day.innerHTML = ''
          addPlaceholder(day, 'æ—¥')
          var monthNum = Number(e.target.value)
          console.log(monthNum)
          if (monthNum === 2) {
            if (Number(year.value) === 2024 || Number(year.value) === 2028) {
              addOptions(day, 1, 29)
            } else {
              addOptions(day, 1, 28)
            }
          } else if (monthNum === 4 || monthNum === 6 || monthNum === 9 || monthNum === 11) {
            addOptions(day, 1, 30)
          } else {
            addOptions(day, 1, 30)
          }
        }
        handleChange()
      })
    }
  },
  setupPrefectures: function (el) {
    el.firstChild.innerText = 'é¸æŠžã—ã¦ãã ã•ã„'
    el.firstChild.setAttribute('disabled', 'disabled')
    el.firstChild.setAttribute('value', '')

    var frag = document.createDocumentFragment();
    var prefectureMap = ["åŒ—æµ·é“","é’æ£®çœŒ","å²©æ‰‹çœŒ","å®®åŸŽçœŒ","ç§‹ç”°çœŒ","å±±å½¢çœŒ","ç¦å³¶çœŒ",
      "èŒ¨åŸŽçœŒ","æ ƒæœ¨çœŒ","ç¾¤é¦¬çœŒ","åŸ¼çŽ‰çœŒ","å…ƒè‘‰çœŒ","æ±äº¬éƒ½","ç¥žå¥ˆå·çœŒ",
      "æ–°æ½ŸçœŒ","å¯Œå±±çœŒ","çŸ³å·çœŒ","ç¦äº•çœŒ","å±±æ¢¨çœŒ","é•·é‡ŽçœŒ","å²é˜œçœŒ",
      "é™å²¡çœŒ","æ„›çŸ¥çœŒ","ä¸‰é‡çœŒ","æ»‹è³€çœŒ","äº¬éƒ½åºœ","å¤§é˜ªåºœ","å…µåº«çœŒ",
      "å¥ˆè‰¯çœŒ","å’Œæ­Œå±±çœŒ","é³鳥å–çœŒ","å³¶æ ¹çœŒ","å²¡å±±çœŒ","åºƒå³¶çœŒ","å±±å£çœŒ",
      "å¾³å³¶çœŒ","é¦™å·çœŒ","æ„›åª›çœŒ","é«˜çŸ¥çœŒ","ç¦å²¡çœŒ","ä½è³€çœŒ","é•·å´ŽçœŒ",
      "ç†Šæœ¬çœŒ","å¤§åˆ†çœŒ","å®®å´ŽçœŒ","é¹¿å…å³¶çœŒ","æ²沖ç¸„çœŒ"]
    for (var i = 0; i < prefectureMap.length; i++) {
      var elOption = document.createElement('option')
      elOption.innerText = prefectureMap[i]
      elOption.setAttribute('value', prefectureMap[i])
      frag.appendChild(elOption)
    }
    el.appendChild(frag)
  },
  setupFile: function (el) {
    var selected = el.querySelector('.sju-field-file-selected')
    el.querySelector('input').addEventListener('change', function (e) {
      console.log(this)
      console.log(e)
      if (e.target.files[0]) {
        selected.innerText = e.target.files[0].name
      } else {
        selected.innerText = 'é¸æŠžã—ã¦ãã ã•ã„'
      }
    })
  }
}

RARU.SHARED.SP_NAV = {
  init: function () {
    if (!this.setParams()) return
    this.bindEvents()
  },
  setParams: function () {
    this.elNav = document.getElementById('jsi-nav')
    this.elNavMain = document.getElementById('jsi-nav-main')
    this.elNavSpToggle = document.getElementById('jsi-sp-nav-toggle')
    this.navItems = this.elNavMain.querySelectorAll('.sju-nav-item')
    this.elNavBrand = document.querySelector('.sju-nav-brand a');
    return true
  },
  bindEvents: function () {
    this.elNavSpToggle.addEventListener('click', this.handleClickToggle.bind(this));

    for (var i = 0; i < this.navItems.length; i++) {
      this.navItems[i].addEventListener('click', this.closeMenu.bind(this));
    }

    if (this.elNavBrand) {
        this.elNavBrand.addEventListener('click', this.closeMenu.bind(this));
    }
  },
  closeMenu: function() {
    this.elNavMain.classList.remove('is-active');
    this.elNavSpToggle.classList.remove('is-active');
  },
  handleClickToggle: function () {
    if (this.elNavMain.classList.contains('is-active')) {
      this.closeMenu();
    } else {
      this.elNavMain.classList.add('is-active')
      this.elNavSpToggle.classList.add('is-active')
    }
  }
}

RARU.SHARED.IMAGE_VIEWER = {
  init: function () {
    if (!this.setParams()) return
    this.bindEvents()
  },
  setParams: function () {
    this.currentViewer = null
    this.viewerTemplate = document.getElementById('jsi-viewer-template')
    console.log(this.viewerTemplate)
    this.viewerTriggers = document.querySelectorAll('.jsc-viewer-trigger')
    return true
  },
  bindEvents: function () {
    var _self = this
    RARU.UTILS.loopElements(this.viewerTriggers, function (el, index) {
      el.addEventListener('click', function (e) {
        e.preventDefault()
        _self.handleClickTrigger(index)
      })
    })
  },
  handleClickTrigger: function (index) {
    const trigger = this.viewerTriggers[index]
    if (!trigger) return;
    const src = trigger.getAttribute('data-src')
    if (!src) return;

    var cloned = document.importNode(this.viewerTemplate.content, true)
    var viewer = cloned.querySelector('.jsc-viewer')
    var close = viewer.querySelector('.jsc-viewer-close')
    var content = viewer.querySelector('.jsc-viewer-content')

    var image = document.createElement('img')
    image.src = src
    content.appendChild(image)

    function handleClose() {
      viewer.parentNode.removeChild(viewer)
    }

    viewer.addEventListener('click', handleClose)
    close.addEventListener('click', function (e) {
      e.stopPropagation()
      handleClose()
    })
    image.addEventListener('click', function (e) {
      e.stopPropagation()
    })

    document.body.appendChild(cloned)
  }
}

window.onload = function () {
  RARU.SHARED.HOME_MV_SLIDER.init()
  RARU.SHARED.HOME_CONTROL.init()
  RARU.SHARED.CONTACT_CONTROL.init()
  RARU.SHARED.ENTRY_CONTROL.init()
  RARU.SHARED.SP_NAV.init()
  RARU.SHARED.IMAGE_VIEWER.init()
  // new RARU.SHARED.INFINITE_SCROLL()
}