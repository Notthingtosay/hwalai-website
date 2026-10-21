(function () {
  'use strict';
  if (window.hwalaiContactTracking) return;
  var destinations = {
    whatsapp: 'AW-18044826821/8ZAZCK3aiqQdEMXpuJxD',
    phone: 'AW-18044826821/toJpCKfUi6QdEMXpuJxD'
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18044826821';
    document.head.appendChild(tag);
    window.gtag('js', new Date());
    window.gtag('config', 'AW-18044826821');
  }
  var last = {};
  function record(kind, callback) {
    var now = Date.now();
    if (last[kind] && now - last[kind] < 1500) { if (callback) callback(); return; }
    last[kind] = now;
    var finished = false;
    function done() {
      if (finished) return;
      finished = true;
      if (callback) callback();
    }
    // Only the conversion configuration is sent. Form fields and
    // WhatsApp message contents must never be added to this payload.
    window.gtag('event', 'conversion', {
      send_to: destinations[kind],
      value: 0,
      currency: 'HKD',
      event_callback: done,
      event_timeout: 800
    });
    if (callback) window.setTimeout(done, 900);
  }
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;
    var href = anchor.getAttribute('href') || '';
    if (/^https:\/\/wa\.me\/85262813185(?:[?/#]|$)/i.test(href)) {
      if (anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        record('whatsapp');
      } else {
        event.preventDefault();
        record('whatsapp', function () { window.location.href = href; });
      }
    } else if (/^tel:\+?85262813185$/i.test(href.replace(/[\s()-]/g, ''))) {
      event.preventDefault();
      record('phone', function () { window.location.href = href; });
    }
  });
  window.hwalaiContactTracking = {
    version: '20261021',
    navigateWhatsApp: function (url) {
      if (!/^https:\/\/wa\.me\/85262813185\?text=/.test(url)) return;
      record('whatsapp', function () { window.location.href = url; });
    }
  };
}());
