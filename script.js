/* ─────────────────────────────────────────────────────────────
   Cozy Food Picker - script.js
   Uses Google Places API (New) — Text Search endpoint.
   Enable "Places API (New)" in Google Cloud Console.
───────────────────────────────────────────────────────────── */

'use strict';

// ── Constants ─────────────────────────────────────────────────
var PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
var GEOCODE_URL            = 'https://maps.googleapis.com/maps/api/geocode/json';

var FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.types',
  'places.photos',
  'places.currentOpeningHours',
  'places.priceLevel',
].join(',');

var PRICE_LEVEL_MAP = {
  'PRICE_LEVEL_FREE':           '(free)',
  'PRICE_LEVEL_INEXPENSIVE':    '$',
  'PRICE_LEVEL_MODERATE':       '$$',
  'PRICE_LEVEL_EXPENSIVE':      '$$$',
  'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
};

// ── Keyword -> API type mapping ────────────────────────────────
// Lets "burger" match hamburger_restaurant even if word isn't in name
var KEYWORD_TYPE_MAP = {
  // Burgers / American
  'burger':         ['hamburger_restaurant','american_restaurant','fast_food_restaurant'],
  'burgers':        ['hamburger_restaurant','american_restaurant','fast_food_restaurant'],
  'hamburger':      ['hamburger_restaurant','american_restaurant'],
  'american':       ['american_restaurant','hamburger_restaurant','steak_house','barbecue_restaurant'],
  'fast food':      ['fast_food_restaurant','american_restaurant'],
  'wings':          ['american_restaurant','fast_food_restaurant'],

  // Steaks / BBQ
  'steak':          ['steak_house','american_restaurant','barbecue_restaurant'],
  'steakhouse':     ['steak_house'],
  'bbq':            ['barbecue_restaurant','american_restaurant'],
  'barbecue':       ['barbecue_restaurant'],
  'grill':          ['barbecue_restaurant','american_restaurant','steak_house'],
  'ribs':           ['barbecue_restaurant','american_restaurant'],
  'smoked':         ['barbecue_restaurant'],

  // Pizza / Italian
  'pizza':          ['pizza_restaurant','italian_restaurant'],
  'italian':        ['italian_restaurant','pizza_restaurant'],
  'pasta':          ['italian_restaurant'],
  'lasagna':        ['italian_restaurant'],
  'risotto':        ['italian_restaurant'],

  // Japanese
  'japanese':       ['japanese_restaurant','sushi_restaurant','ramen_restaurant'],
  'sushi':          ['sushi_restaurant','japanese_restaurant'],
  'ramen':          ['ramen_restaurant','japanese_restaurant'],
  'udon':           ['japanese_restaurant','ramen_restaurant'],
  'tempura':        ['japanese_restaurant'],
  'teriyaki':       ['japanese_restaurant'],

  // Chinese
  'chinese':        ['chinese_restaurant'],
  'dim sum':        ['chinese_restaurant'],
  'dumpling':       ['chinese_restaurant'],
  'dumplings':      ['chinese_restaurant'],

  // Korean
  'korean':         ['korean_restaurant'],
  'kbbq':           ['korean_restaurant'],
  'bibimbap':       ['korean_restaurant'],

  // Thai
  'thai':           ['thai_restaurant'],
  'pad thai':       ['thai_restaurant'],

  // Vietnamese
  'vietnamese':     ['vietnamese_restaurant'],
  'pho':            ['vietnamese_restaurant'],
  'banh mi':        ['vietnamese_restaurant','sandwich_shop'],

  // Indian
  'indian':         ['indian_restaurant'],
  'curry':          ['indian_restaurant','thai_restaurant'],
  'tikka':          ['indian_restaurant'],
  'biryani':        ['indian_restaurant'],

  // Mexican
  'mexican':        ['mexican_restaurant'],
  'taco':           ['mexican_restaurant'],
  'tacos':          ['mexican_restaurant'],
  'burrito':        ['mexican_restaurant'],
  'quesadilla':     ['mexican_restaurant'],
  'tex mex':        ['mexican_restaurant','american_restaurant'],

  // Mediterranean / Middle Eastern
  'mediterranean':  ['mediterranean_restaurant','greek_restaurant','middle_eastern_restaurant','lebanese_restaurant'],
  'greek':          ['greek_restaurant','mediterranean_restaurant'],
  'middle eastern': ['middle_eastern_restaurant','mediterranean_restaurant','lebanese_restaurant'],
  'lebanese':       ['lebanese_restaurant','middle_eastern_restaurant'],
  'turkish':        ['turkish_restaurant','middle_eastern_restaurant'],
  'falafel':        ['middle_eastern_restaurant','mediterranean_restaurant'],
  'hummus':         ['middle_eastern_restaurant','mediterranean_restaurant'],
  'shawarma':       ['middle_eastern_restaurant','lebanese_restaurant'],
  'kebab':          ['middle_eastern_restaurant','turkish_restaurant','mediterranean_restaurant'],

  // French
  'french':         ['french_restaurant','bakery','cafe'],
  'crepe':          ['french_restaurant','cafe'],
  'crepes':         ['french_restaurant','cafe'],

  // Spanish
  'spanish':        ['spanish_restaurant'],
  'tapas':          ['spanish_restaurant','mediterranean_restaurant'],
  'paella':         ['spanish_restaurant'],

  // Seafood
  'seafood':        ['seafood_restaurant'],
  'fish':           ['seafood_restaurant'],
  'oyster':         ['seafood_restaurant'],
  'lobster':        ['seafood_restaurant'],
  'shrimp':         ['seafood_restaurant'],

  // Vegetarian / Vegan / Healthy
  'vegetarian':     ['vegetarian_restaurant','vegan_restaurant'],
  'vegan':          ['vegan_restaurant','vegetarian_restaurant'],
  'salad':          ['vegetarian_restaurant','vegan_restaurant'],
  'healthy':        ['vegetarian_restaurant','vegan_restaurant'],
  'plant based':    ['vegan_restaurant','vegetarian_restaurant'],
  'plant-based':    ['vegan_restaurant','vegetarian_restaurant'],

  // Breakfast / Brunch
  'breakfast':      ['breakfast_restaurant','brunch_restaurant','cafe','bakery'],
  'brunch':         ['brunch_restaurant','breakfast_restaurant','cafe'],
  'pancakes':       ['breakfast_restaurant','brunch_restaurant'],
  'waffle':         ['breakfast_restaurant','brunch_restaurant'],
  'waffles':        ['breakfast_restaurant','brunch_restaurant'],
  'eggs':           ['breakfast_restaurant','brunch_restaurant','american_restaurant'],
  'omelette':       ['breakfast_restaurant','brunch_restaurant'],

  // Sandwiches / Delis
  'sandwich':       ['sandwich_shop'],
  'sandwiches':     ['sandwich_shop'],
  'sub':            ['sandwich_shop'],
  'hoagie':         ['sandwich_shop'],
  'deli':           ['sandwich_shop'],
  'wrap':           ['sandwich_shop','mediterranean_restaurant'],

  // Noodles (broad)
  'noodles':        ['ramen_restaurant','vietnamese_restaurant','chinese_restaurant','japanese_restaurant','thai_restaurant'],
  'noodle':         ['ramen_restaurant','vietnamese_restaurant','chinese_restaurant','japanese_restaurant','thai_restaurant'],

  // Cafe / Coffee
  'cafe':           ['cafe','coffee_shop','bakery'],
  'coffee':         ['coffee_shop','cafe'],
  'espresso':       ['coffee_shop','cafe'],
  'latte':          ['coffee_shop','cafe'],

  // Bakery / Dessert
  'bakery':         ['bakery'],
  'pastry':         ['bakery','french_restaurant'],
  'bread':          ['bakery'],
  'dessert':        ['dessert_shop','ice_cream_shop','bakery'],
  'ice cream':      ['ice_cream_shop','dessert_shop'],
  'gelato':         ['ice_cream_shop','dessert_shop','italian_restaurant'],
  'cake':           ['bakery','dessert_shop'],
  'donut':          ['bakery','dessert_shop'],
  'donuts':         ['bakery','dessert_shop'],

  // Indonesian
  'indonesian':     ['indonesian_restaurant'],
};

// ── State ──────────────────────────────────────────────────────
var state = {
  apiKey:              null,
  userLocation:        null,   // GPS-acquired { lat, lng }
  customLocation:      null,   // user-typed { lat, lng, name }
  allRestaurants:      [],
  filteredPool:        [],
  recentIndices:       new Set(),
  whitelistTags:       [],
  blacklistTags:       [],
  isDark:              false,
  locationReady:       false,  // GPS acquired
  openNow:             false,
  selectedPriceLevels: [],
  _lastCacheKey:       null,
};

// Returns whichever location is active for searches
function getSearchLocation() {
  return state.customLocation || state.userLocation || null;
}

function $(id) { return document.getElementById(id); }

// DOM refs populated in init()
var el = {};

// ── Cuisine emoji lookup ───────────────────────────────────────
function getCuisineEmoji(str) {
  var s = (str || '').toLowerCase().replace(/_/g, ' ');
  if (s.indexOf('pizza') >= 0)         return '🍕';
  if (s.indexOf('sushi') >= 0)         return '🍣';
  if (s.indexOf('japanese') >= 0)      return '🍱';
  if (s.indexOf('ramen') >= 0)         return '🍜';
  if (s.indexOf('thai') >= 0)          return '🍜';
  if (s.indexOf('chinese') >= 0)       return '🥡';
  if (s.indexOf('indian') >= 0)        return '🍛';
  if (s.indexOf('mexican') >= 0)       return '🌮';
  if (s.indexOf('korean') >= 0)        return '🥘';
  if (s.indexOf('vietnamese') >= 0)    return '🍲';
  if (s.indexOf('italian') >= 0)       return '🍝';
  if (s.indexOf('french') >= 0)        return '🥐';
  if (s.indexOf('hamburger') >= 0)     return '🍔';
  if (s.indexOf('american') >= 0)      return '🍔';
  if (s.indexOf('burger') >= 0)        return '🍔';
  if (s.indexOf('bbq') >= 0)           return '🥩';
  if (s.indexOf('barbecue') >= 0)      return '🥩';
  if (s.indexOf('steak') >= 0)         return '🥩';
  if (s.indexOf('seafood') >= 0)       return '🦞';
  if (s.indexOf('mediterranean') >= 0) return '🫒';
  if (s.indexOf('greek') >= 0)         return '🫒';
  if (s.indexOf('turkish') >= 0)       return '🧆';
  if (s.indexOf('middle eastern') >= 0)return '🧆';
  if (s.indexOf('lebanese') >= 0)      return '🧆';
  if (s.indexOf('vegan') >= 0)         return '🌿';
  if (s.indexOf('vegetarian') >= 0)    return '🌿';
  if (s.indexOf('salad') >= 0)         return '🥗';
  if (s.indexOf('sandwich') >= 0)      return '🥪';
  if (s.indexOf('bakery') >= 0)        return '🥐';
  if (s.indexOf('cafe') >= 0)          return '☕';
  if (s.indexOf('coffee') >= 0)        return '☕';
  if (s.indexOf('dessert') >= 0)       return '🍰';
  if (s.indexOf('ice cream') >= 0)     return '🍦';
  if (s.indexOf('breakfast') >= 0)     return '🥞';
  if (s.indexOf('brunch') >= 0)        return '🥞';
  if (s.indexOf('noodle') >= 0)        return '🍝';
  if (s.indexOf('spanish') >= 0)       return '🥘';
  if (s.indexOf('fast food') >= 0)     return '🍟';
  return '🍽️';
}

// ── Build text query from whitelist tags ───────────────────────
// Whitelist tags drive the API query directly for much better results
function buildTextQuery() {
  if (!state.whitelistTags.length) return 'restaurant';
  return state.whitelistTags.join(' ') + ' restaurant';
}

// ── Cache key — invalidates when any search param changes ──────
function getCacheKey() {
  var loc = getSearchLocation();
  return [
    getRadius(),
    buildTextQuery(),
    state.openNow ? '1' : '0',
    state.selectedPriceLevels.slice().sort().join(','),
    loc ? (loc.lat.toFixed(4) + ',' + loc.lng.toFixed(4)) : 'none',
  ].join('|');
}

// ── Geocode an address string ──────────────────────────────────
async function geocodeAddress(address) {
  var url = GEOCODE_URL + '?address=' + encodeURIComponent(address) + '&key=' + state.apiKey;
  var resp = await fetch(url);
  if (!resp.ok) throw new Error('Geocoding request failed (HTTP ' + resp.status + ')');
  var data = await resp.json();
  if (data.status === 'REQUEST_DENIED') {
    throw new Error('Geocoding API denied. Make sure "Geocoding API" is enabled on your key in Google Cloud Console.');
  }
  if (data.status !== 'OK' || !data.results || !data.results.length) {
    throw new Error('Could not find that location. Try a city name, zip code, or full address.');
  }
  var r = data.results[0];
  return {
    lat:  r.geometry.location.lat,
    lng:  r.geometry.location.lng,
    name: r.formatted_address,
  };
}

// ── Matching: does a single term match a place? ────────────────
function termMatchesPlace(term, place) {
  var t = term.toLowerCase().trim();
  if (!t) return true;

  var name         = ((place.displayName && place.displayName.text) || '').toLowerCase();
  var primaryType  = (place.primaryType || '').toLowerCase();
  var primaryHuman = primaryType.replace(/_/g, ' ');
  var types        = (place.types || []).map(function(x) { return x.toLowerCase(); });
  var typesHuman   = types.map(function(x) { return x.replace(/_/g, ' '); });

  if (name.indexOf(t) >= 0) return true;
  if (primaryHuman.indexOf(t) >= 0) return true;
  for (var i = 0; i < typesHuman.length; i++) {
    if (typesHuman[i].indexOf(t) >= 0) return true;
  }

  var mapped = KEYWORD_TYPE_MAP[t];
  if (mapped) {
    for (var j = 0; j < mapped.length; j++) {
      var mt = mapped[j].toLowerCase();
      if (primaryType === mt) return true;
      var mtCore = mt.replace(/_restaurant$/, '').replace(/_shop$/, '').replace(/_house$/, '');
      if (mtCore.length > 3 && primaryType.indexOf(mtCore) >= 0) return true;
      for (var k = 0; k < types.length; k++) {
        if (types[k] === mt) return true;
        if (mtCore.length > 3 && types[k].indexOf(mtCore) >= 0) return true;
      }
    }
  }

  return false;
}

// ── Filter: blacklist only (whitelist is handled by text query) ─
function matchesFilters(place) {
  // Blacklist: exclude if ANY blacklist term matches
  for (var i = 0; i < state.blacklistTags.length; i++) {
    if (termMatchesPlace(state.blacklistTags[i], place)) return false;
  }
  return true;
}

// ── Radius helpers ─────────────────────────────────────────────
function getRadius() {
  if (!el.radiusPills) return '8047';
  var active = el.radiusPills.querySelector('.radius-pill.active');
  return active ? active.dataset.value : '8047';
}

function setActiveRadius(value) {
  if (!el.radiusPills) return;
  var pills = el.radiusPills.querySelectorAll('.radius-pill');
  pills.forEach(function(p) {
    p.classList.toggle('active', p.dataset.value === String(value));
  });
}

// ── Theme ──────────────────────────────────────────────────────
function applyTheme(dark, save) {
  if (save === undefined) save = true;
  state.isDark = dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  el.themeIcon.textContent = dark ? '☀️' : '🌙';
  el.themeToggle.title = dark ? 'Day cafe mode' : 'Night cafe mode';
  if (save) savePrefs();
}

// ── Persistence ────────────────────────────────────────────────
function savePrefs() {
  try {
    localStorage.setItem('cfp_whitelist',    JSON.stringify(state.whitelistTags));
    localStorage.setItem('cfp_blacklist',    JSON.stringify(state.blacklistTags));
    localStorage.setItem('cfp_radius',       getRadius());
    localStorage.setItem('cfp_dark',         state.isDark ? '1' : '0');
    localStorage.setItem('cfp_open_now',     state.openNow ? '1' : '0');
    localStorage.setItem('cfp_price_levels', JSON.stringify(state.selectedPriceLevels));
    if (state.customLocation) {
      localStorage.setItem('cfp_custom_loc', JSON.stringify(state.customLocation));
    } else {
      localStorage.removeItem('cfp_custom_loc');
    }
  } catch(e) {}
}

function loadPrefs() {
  try {
    var wl = localStorage.getItem('cfp_whitelist');
    var bl = localStorage.getItem('cfp_blacklist');
    var r  = localStorage.getItem('cfp_radius');
    var dk = localStorage.getItem('cfp_dark');
    var on = localStorage.getItem('cfp_open_now');
    var pl = localStorage.getItem('cfp_price_levels');
    var cl = localStorage.getItem('cfp_custom_loc');
    if (wl) JSON.parse(wl).forEach(function(t) { addTag('whitelist', t, false); });
    if (bl) JSON.parse(bl).forEach(function(t) { addTag('blacklist', t, false); });
    if (r)  setActiveRadius(r);
    if (dk === '1') applyTheme(true, false);
    if (on === '1') setOpenNow(true, false);
    if (pl) JSON.parse(pl).forEach(function(v) { togglePriceLevel(v, false); });
    if (cl) {
      var loc = JSON.parse(cl);
      setCustomLocation(loc, false);  // restore without saving again
    }
  } catch(e) {}
}

function loadApiKey()    { try { return localStorage.getItem('cfp_apikey') || null; } catch(e) { return null; } }
function saveApiKey(key) { try { localStorage.setItem('cfp_apikey', key); } catch(e) {} }
function clearApiKey()   { try { localStorage.removeItem('cfp_apikey'); } catch(e) {} }

// ── Custom location ────────────────────────────────────────────
function setCustomLocation(loc, save) {
  if (save === undefined) save = true;
  state.customLocation = loc;   // { lat, lng, name } or null
  invalidateCache();
  updateLocationBadge();
  updatePickBtnState();
  if (save) savePrefs();
}

function clearCustomLocation(save) {
  if (save === undefined) save = true;
  state.customLocation = null;
  if (el.locationInput) el.locationInput.value = '';
  invalidateCache();
  updateLocationBadge();
  updatePickBtnState();
  if (save) savePrefs();
}

function updatePickBtnState() {
  if (!el.pickBtn) return;
  el.pickBtn.disabled = !getSearchLocation();
}

function updateLocationBadge() {
  if (!el.locationBadge) return;
  var loc = getSearchLocation();
  if (!loc) {
    el.locationBadge.textContent = '';
    el.locationBadge.className = 'location-badge';
    return;
  }
  if (state.customLocation) {
    el.locationBadge.textContent = '📍 ' + state.customLocation.name;
    el.locationBadge.className = 'location-badge custom';
  } else {
    el.locationBadge.textContent = '✅ Using your current location';
    el.locationBadge.className = 'location-badge ok';
  }
  // GPS button highlight: lit up when GPS is the active source
  if (el.locationGpsBtn) {
    el.locationGpsBtn.classList.toggle('gps-active', !state.customLocation && state.locationReady);
  }
}

// ── Open now ───────────────────────────────────────────────────
function setOpenNow(val, save) {
  if (save === undefined) save = true;
  state.openNow = val;
  if (el.openNowToggle) el.openNowToggle.checked = val;
  invalidateCache();
  if (save) savePrefs();
}

// ── Price level ────────────────────────────────────────────────
function togglePriceLevel(value, save) {
  if (save === undefined) save = true;
  var idx = state.selectedPriceLevels.indexOf(value);
  if (idx >= 0) {
    state.selectedPriceLevels.splice(idx, 1);
  } else {
    state.selectedPriceLevels.push(value);
  }
  // Update pill UI
  if (el.pricePills) {
    var pills = el.pricePills.querySelectorAll('.price-pill');
    pills.forEach(function(p) {
      p.classList.toggle('active', state.selectedPriceLevels.indexOf(p.dataset.value) >= 0);
    });
  }
  invalidateCache();
  if (save) savePrefs();
}

// ── Cache invalidation ─────────────────────────────────────────
function invalidateCache() {
  state.allRestaurants = [];
  state.recentIndices.clear();
  state._lastCacheKey = null;
}

// ── Tag system ─────────────────────────────────────────────────
function addTag(list, raw, save) {
  if (save === undefined) save = true;
  var value = raw.trim().toLowerCase().replace(/,+$/, '');
  if (!value) return;
  var arr = list === 'whitelist' ? state.whitelistTags : state.blacklistTags;
  if (arr.indexOf(value) >= 0) return;
  arr.push(value);
  renderTag(list, value);
  // Whitelist changes the text query → invalidate API cache
  if (list === 'whitelist') invalidateCache();
  if (save) savePrefs();
}

function removeTag(list, value) {
  var arr = list === 'whitelist' ? state.whitelistTags : state.blacklistTags;
  var i = arr.indexOf(value);
  if (i >= 0) arr.splice(i, 1);
  if (list === 'whitelist') invalidateCache();
  savePrefs();
}

function renderTag(list, value) {
  var container = list === 'whitelist' ? el.whitelistTags : el.blacklistTags;
  var tag = document.createElement('span');
  tag.className = 'tag ' + list;
  tag.dataset.value = value;
  var escaped = value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  tag.innerHTML = escaped + '<button class="tag-remove" title="Remove" aria-label="Remove">&#xD7;</button>';
  tag.querySelector('.tag-remove').addEventListener('click', function() {
    removeTag(list, value);
    tag.remove();
  });
  container.appendChild(tag);
}

function setupTagInput(inputEl, list) {
  var wrap = inputEl.closest('.tag-input-wrap');
  wrap.addEventListener('click', function() { inputEl.focus(); });

  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputEl.value.trim()) { addTag(list, inputEl.value); inputEl.value = ''; }
    } else if (e.key === 'Backspace' && !inputEl.value) {
      var arr = list === 'whitelist' ? state.whitelistTags : state.blacklistTags;
      if (!arr.length) return;
      var last = arr[arr.length - 1];
      removeTag(list, last);
      var container = list === 'whitelist' ? el.whitelistTags : el.blacklistTags;
      var tags = container.querySelectorAll('.tag');
      if (tags.length) tags[tags.length - 1].remove();
    }
  });

  inputEl.addEventListener('blur', function() {
    if (inputEl.value.trim()) { addTag(list, inputEl.value); inputEl.value = ''; }
  });

  inputEl.addEventListener('paste', function(e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text');
    text.split(',').forEach(function(t) { if (t.trim()) addTag(list, t.trim()); });
  });
}

// ── Section visibility ─────────────────────────────────────────
function showSection(name) {
  el.loadingCard.hidden        = name !== 'loading';
  el.resultCard.hidden         = name !== 'result';
  el.noResultsCard.hidden      = name !== 'noResults';
  el.locationDeniedCard.hidden = name !== 'locationDenied';
}

// ── Geolocation ────────────────────────────────────────────────
function getLocation() {
  return new Promise(function(resolve, reject) {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported.')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 12000, maximumAge: 60000
    });
  });
}

// ── Places API (New) — Text Search fetch ───────────────────────
// Uses textQuery built from whitelist tags for much better relevance.
// openNow and priceLevels are sent directly to the API.
async function fetchRestaurants(lat, lng, radius) {
  var body = {
    textQuery:      buildTextQuery(),
    maxResultCount: 20,
    rankPreference: 'DISTANCE',
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: parseFloat(radius),
      },
    },
  };

  if (state.openNow) body.openNow = true;
  if (state.selectedPriceLevels.length > 0) body.priceLevels = state.selectedPriceLevels;

  var resp = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type':     'application/json',
      'X-Goog-Api-Key':   state.apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    var msg = 'HTTP ' + resp.status;
    try {
      var json = await resp.json();
      var apiMsg = json.error && (json.error.message || json.error.status);
      if (apiMsg) msg = apiMsg;
    } catch(e) {}
    if (resp.status === 401) msg = 'Invalid API key — double-check it in Google Cloud Console.';
    if (resp.status === 403) msg = 'Access denied. Make sure "Places API (New)" is enabled on your key.\n\nGo to: console.cloud.google.com > APIs & Services > Library > search "Places API (New)" > Enable.';
    if (resp.status === 429) msg = 'Quota exceeded. Check your usage limits in Google Cloud Console.';
    throw new Error(msg);
  }

  var data = await resp.json();
  return data.places || [];
}

// ── Random pick (rating-weighted, avoids recent repeats) ───────
function pickRandom(pool) {
  if (!pool.length) return null;

  var available = pool.filter(function(_, i) { return !state.recentIndices.has(i); });
  if (!available.length) { state.recentIndices.clear(); available = pool; }

  var weights = available.map(function(p) { return Math.pow(p.rating || 3, 1.5); });
  var total   = weights.reduce(function(a, b) { return a + b; }, 0);
  var rand    = Math.random() * total;
  var chosen  = available[0];

  for (var i = 0; i < available.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { chosen = available[i]; break; }
  }

  var globalIdx = pool.indexOf(chosen);
  state.recentIndices.add(globalIdx);
  if (state.recentIndices.size > Math.ceil(pool.length / 2)) {
    state.recentIndices.delete(state.recentIndices.values().next().value);
  }
  return chosen;
}

// ── Display result ─────────────────────────────────────────────
function displayResult(place) {
  var typeStr = (place.primaryType || '') + ' ' + ((place.displayName && place.displayName.text) || '');
  el.resultBadge.textContent = getCuisineEmoji(typeStr);

  el.resultName.textContent = (place.displayName && place.displayName.text) || 'Mystery Restaurant';

  if (place.rating) {
    var stars = Math.min(Math.round(place.rating), 5);
    var starsStr = '';
    for (var i = 0; i < stars; i++) starsStr += '⭐';
    var countStr = place.userRatingCount
      ? ' <span class="rating-count">(' + place.userRatingCount.toLocaleString() + ')</span>'
      : '';
    el.resultRating.innerHTML = starsStr + ' <strong>' + place.rating.toFixed(1) + '</strong>' + countStr;
    el.resultRating.hidden = false;
  } else {
    el.resultRating.hidden = true;
  }

  var raw = (place.primaryType || '')
    .replace(/_restaurant$/, '')
    .replace(/_shop$/, '')
    .replace(/_house$/, '')
    .replace(/_/g, ' ')
    .trim();
  if (raw && raw !== 'restaurant' && raw !== 'food' && raw !== 'establishment') {
    el.resultCuisine.textContent = '🍴 ' + capitalize(raw);
    el.resultCuisine.hidden = false;
  } else {
    el.resultCuisine.hidden = true;
  }

  // Price level badge
  if (place.priceLevel && PRICE_LEVEL_MAP[place.priceLevel] && place.priceLevel !== 'PRICE_LEVEL_FREE') {
    el.resultPrice.textContent = PRICE_LEVEL_MAP[place.priceLevel];
    el.resultPrice.hidden = false;
  } else {
    el.resultPrice.hidden = true;
  }

  // Open now badge
  var hours = place.currentOpeningHours;
  if (hours && typeof hours.openNow === 'boolean') {
    if (hours.openNow) {
      el.resultHours.textContent = '✅ Open now';
      el.resultHours.className = 'result-hours open';
    } else {
      el.resultHours.textContent = '🔴 Currently closed';
      el.resultHours.className = 'result-hours closed';
    }
    el.resultHours.hidden = false;
  } else {
    el.resultHours.hidden = true;
  }

  el.resultAddress.textContent = place.formattedAddress || '';

  if (place.photos && place.photos.length > 0) {
    var photoUrl = 'https://places.googleapis.com/v1/' + place.photos[0].name
      + '/media?maxWidthPx=800&key=' + state.apiKey;
    el.resultPhoto.src = photoUrl;
    el.resultPhoto.onerror = function() { el.resultPhotoWrap.hidden = true; };
    el.resultPhotoWrap.hidden = false;
  } else {
    el.resultPhotoWrap.hidden = true;
  }

  var q = encodeURIComponent(
    ((place.displayName && place.displayName.text) || '') + ' ' + (place.formattedAddress || '')
  );
  el.mapsLink.href = 'https://www.google.com/maps/search/?api=1&query=' + q
    + '&query_place_id=' + (place.id || '');

  showSection('result');
}

// ── Main pick flow ─────────────────────────────────────────────
async function doPick() {
  if (!getSearchLocation()) return;

  el.pickBtn.disabled = true;
  showSection('loading');

  try {
    var radius   = getRadius();
    var cacheKey = getCacheKey();

    var searchLoc = getSearchLocation();
    if (!searchLoc) { el.pickBtn.disabled = false; return; }

    if (!state.allRestaurants.length || state._lastCacheKey !== cacheKey) {
      var query = buildTextQuery();
      var loadMsg = query === 'restaurant'
        ? 'Searching nearby spots... 📍'
        : 'Looking for ' + query + ' nearby... 🔍';
      el.loadingText.textContent = loadMsg;

      state.allRestaurants = await fetchRestaurants(
        searchLoc.lat,
        searchLoc.lng,
        radius
      );
      state._lastCacheKey = cacheKey;
      state.recentIndices.clear();
    }

    el.loadingText.textContent = 'Picking something yummy for you... 🌸';

    state.filteredPool = state.allRestaurants.filter(matchesFilters);

    if (!state.filteredPool.length) {
      showSection('noResults');
      return;
    }

    var pick = pickRandom(state.filteredPool);
    if (pick) displayResult(pick);
    else showSection('noResults');

  } catch(err) {
    console.error('[Cozy Food Picker]', err);
    el.locationDeniedCard.querySelector('.error-emoji').textContent = '😕';
    el.locationDeniedCard.querySelector('.error-text').textContent  = 'Something went wrong';
    el.locationDeniedCard.querySelector('.error-hint').textContent  = err.message || 'Unknown error — check the browser console.';
    showSection('locationDenied');
  } finally {
    el.pickBtn.disabled = false;
  }
}

// ── Location ───────────────────────────────────────────────────
async function acquireLocation() {
  setStatus('📍 Getting your location...', '');
  try {
    var pos = await getLocation();
    state.userLocation  = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    state.locationReady = true;
    setStatus('✅ Ready to find yummy food nearby!', 'ok');
    // Only enable pick btn / update badge via GPS if user hasn't already set a custom location
    updateLocationBadge();
    updatePickBtnState();
  } catch(err) {
    state.locationReady = false;
    setStatus('📍 Location access was denied', 'err');
    // Only show denied screen if no custom location is set either
    if (!state.customLocation) {
      showSection('locationDenied');
    }
  }
}

function setStatus(text, cls) {
  el.locationStatus.textContent = text;
  el.locationStatus.className   = 'location-status' + (cls ? ' ' + cls : '');
}

async function startWithKey(key) {
  state.apiKey = key;
  hideKeyError();
  el.setupCard.hidden  = true;
  el.filterCard.hidden = false;
  showSection(null);
  // If a custom location is already loaded, the pick button can enable immediately
  updatePickBtnState();
  // GPS acquisition runs in parallel — it'll update the badge/button when done
  acquireLocation();
}

function showKeyError(msg) { el.keyError.textContent = msg; el.keyError.hidden = false; }
function hideKeyError()    { el.keyError.hidden = true; }

function isLikelyValidKey(key) {
  return key && key.startsWith('AIza') && key.length >= 30;
}

// ── Init ───────────────────────────────────────────────────────
function init() {
  // Assign DOM refs
  el.themeToggle        = $('themeToggle');
  el.themeIcon          = $('themeIcon');
  el.fileProtocolWarn   = $('fileProtocolWarn');
  el.setupCard          = $('setupCard');
  el.keyError           = $('keyError');
  el.filterCard         = $('filterCard');
  el.apiKeyInput        = $('apiKeyInput');
  el.saveKeyBtn         = $('saveKeyBtn');
  el.pickBtn            = $('pickBtn');
  el.locationStatus     = $('locationStatus');
  el.loadingCard        = $('loadingCard');
  el.loadingText        = $('loadingText');
  el.resultCard         = $('resultCard');
  el.resultBadge        = $('resultBadge');
  el.resultPhotoWrap    = $('resultPhotoWrap');
  el.resultPhoto        = $('resultPhoto');
  el.resultName         = $('resultName');
  el.resultRating       = $('resultRating');
  el.resultCuisine      = $('resultCuisine');
  el.resultPrice        = $('resultPrice');
  el.resultHours        = $('resultHours');
  el.resultAddress      = $('resultAddress');
  el.rerollBtn          = $('rerollBtn');
  el.mapsLink           = $('mapsLink');
  el.noResultsCard      = $('noResultsCard');
  el.locationDeniedCard = $('locationDeniedCard');
  el.retryLocationBtn   = $('retryLocationBtn');
  el.whitelistInput     = $('whitelistInput');
  el.whitelistTags      = $('whitelistTags');
  el.blacklistInput     = $('blacklistInput');
  el.blacklistTags      = $('blacklistTags');
  el.radiusPills        = $('radiusPills');
  el.pricePills         = $('pricePills');
  el.openNowToggle      = $('openNowToggle');
  el.locationInput      = $('locationInput');
  el.locationGpsBtn     = $('locationGpsBtn');
  el.locationBadge      = $('locationBadge');
  el.changeKeyBtn       = $('changeKeyBtn');

  // Theme toggle
  el.themeToggle.addEventListener('click', function() { applyTheme(!state.isDark); });

  // file:// warning
  if (window.location.protocol === 'file:') {
    el.fileProtocolWarn.hidden = false;
  }

  // Load saved prefs
  loadPrefs();
  updateLocationBadge();   // show restored custom location immediately
  setupTagInput(el.whitelistInput, 'whitelist');
  setupTagInput(el.blacklistInput, 'blacklist');

  // Radius pill clicks — invalidate cache when distance changes
  var pills = el.radiusPills.querySelectorAll('.radius-pill');
  pills.forEach(function(pill) {
    pill.addEventListener('click', function() {
      var prev = getRadius();
      setActiveRadius(pill.dataset.value);
      if (prev !== pill.dataset.value) {
        invalidateCache();
        savePrefs();
      }
    });
  });

  // Price pill clicks — multi-select toggle
  if (el.pricePills) {
    var pricePills = el.pricePills.querySelectorAll('.price-pill');
    pricePills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        togglePriceLevel(pill.dataset.value);
      });
    });
  }

  // Open now toggle
  if (el.openNowToggle) {
    el.openNowToggle.addEventListener('change', function() {
      setOpenNow(el.openNowToggle.checked);
    });
  }

  // Location input — geocode on Enter, or blur if value changed
  if (el.locationInput) {
    var lastGeocodedValue = '';

    async function applyLocationInput() {
      var raw = el.locationInput.value.trim();
      if (!raw || raw === lastGeocodedValue) return;
      el.locationBadge.textContent = '🔍 Looking up location…';
      el.locationBadge.className = 'location-badge';
      el.locationGpsBtn.classList.remove('gps-active');
      try {
        var loc = await geocodeAddress(raw);
        lastGeocodedValue = raw;
        setCustomLocation(loc);
      } catch(err) {
        el.locationBadge.textContent = '⚠️ ' + err.message;
        el.locationBadge.className = 'location-badge err';
      }
    }

    el.locationInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); applyLocationInput(); }
    });

    el.locationInput.addEventListener('blur', applyLocationInput);

    // Restore saved custom location name into the input
    if (state.customLocation && state.customLocation.name) {
      el.locationInput.value = state.customLocation.name;
      lastGeocodedValue = state.customLocation.name;
    }
  }

  // GPS button — revert to current device location
  if (el.locationGpsBtn) {
    el.locationGpsBtn.addEventListener('click', function() {
      clearCustomLocation();
      // Re-acquire GPS if we don't have it yet
      if (!state.locationReady) {
        acquireLocation();
      } else {
        updateLocationBadge();
        updatePickBtnState();
      }
    });
  }

  // Start
  var storedKey = loadApiKey();
  if (storedKey) {
    startWithKey(storedKey);
  } else {
    el.setupCard.hidden  = false;
    el.filterCard.hidden = true;
  }

  // Save key
  el.saveKeyBtn.addEventListener('click', function() {
    var key = el.apiKeyInput.value.trim();
    if (!key) { el.apiKeyInput.focus(); showKeyError('Please paste your API key above.'); return; }
    if (!isLikelyValidKey(key)) {
      showKeyError('Does not look like a valid Google API key (should start with "AIza...").');
      return;
    }
    saveApiKey(key);
    el.apiKeyInput.value = '';
    startWithKey(key);
  });

  el.apiKeyInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') el.saveKeyBtn.click(); hideKeyError(); });
  el.apiKeyInput.addEventListener('input', hideKeyError);

  el.pickBtn.addEventListener('click', doPick);

  el.rerollBtn.addEventListener('click', function() {
    if (!state.filteredPool.length) { doPick(); return; }
    var pick = pickRandom(state.filteredPool);
    if (!pick) { doPick(); return; }
    el.resultCard.style.animation = 'none';
    void el.resultCard.offsetHeight;
    el.resultCard.style.animation = '';
    displayResult(pick);
  });

  el.retryLocationBtn.addEventListener('click', function() {
    showSection(null);
    acquireLocation();
  });

  el.changeKeyBtn.addEventListener('click', function() {
    clearApiKey();
    state.apiKey        = null;
    state.locationReady = false;
    invalidateCache();
    el.setupCard.hidden  = false;
    el.filterCard.hidden = true;
    showSection(null);
    el.pickBtn.disabled  = true;
    setStatus('📍 Waiting for your location...', '');
  });
}

function capitalize(s) {
  return s.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

document.addEventListener('DOMContentLoaded', init);
