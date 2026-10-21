import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code = await fs.readFile(new URL('../../site-assets/consultation-tracking-20261021.js', import.meta.url), 'utf8');
function fixture() {
  const events = [], listeners = {}, timers = [], location = { href: '' };
  const window = { location, dataLayer: [], setTimeout: fn => timers.push(fn), gtag: (...args) => events.push(args) };
  const document = { querySelector: () => ({}), addEventListener: (name, fn) => { listeners[name] = fn; } };
  const context = vm.createContext({ window, document, Date });
  vm.runInContext(code, context);
  function click(href, target = '') {
    const event = { button: 0, target: { closest: () => ({ target, getAttribute: () => href }) }, preventDefault() { this.defaultPrevented = true; } };
    listeners.click(event); return event;
  }
  return { events, window, click, timers, context };
}
const f = fixture();
assert.equal(f.events.length, 0, 'Page views are not inquiries');
f.click('https://wa.me/85262813185', '_blank');
assert.equal(f.events.length, 1);
assert.match(f.events[0][2].send_to, /8ZAZCK3aiqQdEMXpuJxD$/);
f.click('https://wa.me/85262813185', '_blank');
assert.equal(f.events.length, 1, 'Rapid double clicks suppressed');
f.click('tel:+8613527277171');
assert.equal(f.events.length, 1, 'Warehouse calls excluded');
assert.equal(f.click('tel:+85262813185').defaultPrevented, true);
assert.equal(f.events.length, 2);
assert.equal(f.window.location.href, '');
f.events[1][2].event_callback();
assert.equal(f.window.location.href, 'tel:+85262813185');
vm.runInContext(code, f.context);
assert.equal(f.events.length, 2);
const form = fixture();
const destination = 'https://wa.me/85262813185?text=PRIVATE_TEST_MESSAGE';
form.window.hwalaiContactTracking.navigateWhatsApp(destination);
assert.equal(form.events.length, 1);
assert.equal(JSON.stringify(form.events).includes('PRIVATE_TEST_MESSAGE'), false);
assert.equal(form.window.location.href, '');
form.timers[0]();
assert.equal(form.window.location.href, destination);
form.events[0][2].event_callback();
assert.equal(form.events.length, 1);
console.log('PASS: page views, WhatsApp clicks, phone filtering, duplicates, form privacy and navigation fallback');
