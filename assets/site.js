function removeUnprocessedMikroTikDirectives() {
  if (!document.body || typeof NodeFilter === 'undefined') return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) {
    const value = walker.currentNode.nodeValue || '';
    if (/\$\((?:if\s+chap-id|endif)\)/i.test(value)) {
      nodes.push(walker.currentNode);
    }
  }

  nodes.forEach((node) => {
    node.nodeValue = (node.nodeValue || '').replace(/\$\((?:if\s+chap-id|endif)\)/gi, '');
  });
}

removeUnprocessedMikroTikDirectives();

const CONFIG = {
  announcements: [
    'مرحبًا بك في شبكة الأديب نت — احتفظ برقم كرتك ولا تشاركه مع الآخرين.',
    'لأفضل اتصال اختر شبكة الأديب التي تظهر بجانبها ثلاث أو أربع شرائط إشارة.',
    'يمكنك الدخول أو تحديث سرعة الكرت من النموذج نفسه بسهولة.'
  ],
  speedUpdateEndpoint: '',
  sliderInterval: 5400
};

const cardInput = document.getElementById('cardNumber');
const loginForm = document.getElementById('loginForm');
const loginPassword = document.getElementById('loginPassword');
const selectedSpeed = document.getElementById('selectedSpeed');
const updatesToggle = document.getElementById('updatesToggle');
const updatesValue = document.getElementById('updatesValue');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');
const noticeBox = document.getElementById('noticeBox');
const noticeText = document.getElementById('noticeText');
const speedTip = document.getElementById('speedTip');

const speedMessages = {
  economy: 'السرعة الاقتصادية مناسبة للمراسلة والتصفح الخفيف وتساعد على تقليل الاستهلاك.',
  balanced: 'السرعة المتوازنة مناسبة للاستخدام اليومي والفيديو بجودة مستقرة.',
  fast: 'السرعة السريعة مناسبة للفيديو والتطبيقات التي تحتاج استجابة أعلى.',
  turbo: 'السرعة الفائقة مناسبة للألعاب والبث المباشر عند توفر إشارة قوية.'
};

function getSpeed() {
  return document.querySelector('input[name="speedChoice"]:checked')?.value || 'balanced';
}

function cleanCard(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[^0-9A-Za-z_-]/g, '');
}

function hideMessages() {
  errorBox?.classList.remove('show');
  noticeBox?.classList.remove('show');
}

function showError(message) {
  if (!errorBox || !errorText) return;
  errorText.textContent = message;
  errorBox.classList.add('show');
  noticeBox?.classList.remove('show');
}

function showNotice(message) {
  if (!noticeBox || !noticeText) return;
  noticeText.textContent = message;
  noticeBox.classList.add('show');
  errorBox?.classList.remove('show');
}

function validateCard() {
  const value = cleanCard(cardInput?.value);
  if (cardInput) cardInput.value = value;
  if (value.length < 4) {
    showError('يرجى إدخال رقم الكرت كاملًا كما هو مطبوع.');
    cardInput?.focus();
    return false;
  }
  hideMessages();
  return true;
}

document.querySelectorAll('input[name="speedChoice"]').forEach((input) => {
  input.addEventListener('change', () => {
    const speed = getSpeed();
    if (selectedSpeed) selectedSpeed.value = speed;
    const tipText = speedTip?.querySelector('span');
    if (tipText) tipText.textContent = speedMessages[speed];
  });
});

updatesToggle?.addEventListener('change', () => {
  if (updatesValue) updatesValue.value = updatesToggle.checked ? 'on' : 'off';
});

document.getElementById('pasteBtn')?.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (cardInput) {
      cardInput.value = cleanCard(text);
      cardInput.focus();
    }
    hideMessages();
  } catch (error) {
    cardInput?.focus();
    showNotice('الصق رقم الكرت يدويًا داخل الحقل.');
  }
});

loginForm?.addEventListener('submit', (event) => {
  if (!validateCard()) {
    event.preventDefault();
    return;
  }

  const card = cleanCard(cardInput?.value);
  if (selectedSpeed) selectedSpeed.value = getSpeed();
  if (updatesValue) updatesValue.value = updatesToggle?.checked ? 'on' : 'off';
  if (loginPassword) loginPassword.value = card;

  const rawAction = loginForm.getAttribute('action') || '';
  const isPreview = rawAction.includes('$(');

  if (isPreview) {
    event.preventDefault();
    showNotice('وضع المعاينة يعمل بنجاح. تسجيل الدخول الحقيقي يبدأ بعد رفع الملفات إلى مجلد Hotspot في الراوتر.');
    return;
  }

  if (document.sendin && typeof hexMD5 === 'function') {
    event.preventDefault();
    document.sendin.username.value = card;
    document.sendin.password.value = hexMD5('$(chap-id)' + card + '$(chap-challenge)');
    document.sendin.submit();
  }
});

document.getElementById('updateSpeedBtn')?.addEventListener('click', async () => {
  if (!validateCard()) return;

  const payload = {
    card: cleanCard(cardInput?.value),
    speed: getSpeed(),
    updates: Boolean(updatesToggle?.checked)
  };

  if (!CONFIG.speedUpdateEndpoint) {
    showNotice('زر تحديث السرعة جاهز، ويحتاج فقط إلى رابط خدمة التحديث من نظام الشبكة.');
    return;
  }

  const button = document.getElementById('updateSpeedBtn');
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = 'جارٍ تحديث السرعة...';

  try {
    const response = await fetch(CONFIG.speedUpdateEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('request_failed');
    showNotice('تم إرسال طلب تحديث السرعة بنجاح.');
  } catch (error) {
    showError('تعذر تحديث السرعة الآن. تحقق من الاتصال أو تواصل مع خدمة العملاء.');
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

if (window.hotspotError && window.hotspotError !== '$(error)') {
  showError(window.hotspotError);
}

const tickerText = document.getElementById('tickerText');
let tickerIndex = 0;
setInterval(() => {
  if (!tickerText || !CONFIG.announcements.length) return;
  tickerIndex = (tickerIndex + 1) % CONFIG.announcements.length;
  tickerText.textContent = CONFIG.announcements[tickerIndex];
}, 8500);

const slides = [...document.querySelectorAll('.slide')];
const dotsContainer = document.getElementById('adDots');
const slider = document.getElementById('adSlider');
const progressFill = document.getElementById('slideProgress');
let currentSlide = 0;
let sliderTimer;
let touchStartX = 0;

function resetProgress() {
  if (!progressFill) return;
  progressFill.classList.remove('running');
  void progressFill.offsetWidth;
  progressFill.classList.add('running');
}

function showSlide(index, manual = false) {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    const active = i === currentSlide;
    slide.classList.toggle('active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
  [...(dotsContainer?.children || [])].forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
  resetProgress();
  if (manual) restartSlider();
}

function restartSlider() {
  clearInterval(sliderTimer);
  resetProgress();
  if (slides.length > 1) {
    sliderTimer = setInterval(() => showSlide(currentSlide + 1), CONFIG.sliderInterval);
  }
}

slides.forEach((_, index) => {
  if (!dotsContainer) return;
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'dot' + (index === 0 ? ' active' : '');
  dot.setAttribute('aria-label', 'عرض الإعلان ' + (index + 1));
  dot.addEventListener('click', () => showSlide(index, true));
  dotsContainer.appendChild(dot);
});

document.getElementById('prevSlide')?.addEventListener('click', () => showSlide(currentSlide - 1, true));
document.getElementById('nextSlide')?.addEventListener('click', () => showSlide(currentSlide + 1, true));
slider?.addEventListener('mouseenter', () => {
  clearInterval(sliderTimer);
  progressFill?.classList.remove('running');
});
slider?.addEventListener('mouseleave', restartSlider);
slider?.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
slider?.addEventListener('touchend', (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 45) showSlide(currentSlide + (delta > 0 ? -1 : 1), true);
}, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInterval(sliderTimer);
  else restartSlider();
});

showSlide(0);
restartSlider();