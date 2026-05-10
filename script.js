const themeToggle = document.getElementById('themeToggle');
const chatAssistant = document.getElementById('chatAssistant');
const chatModal = document.getElementById('chatModal');
const chatClose = document.getElementById('chatClose');

const storedTheme = localStorage.getItem('naijashield-theme');
if (storedTheme === 'light') {
  document.documentElement.classList.add('light-theme');
  themeToggle.textContent = 'Light Mode';
}

themeToggle.addEventListener('click', () => {
  const isLight = document.documentElement.classList.toggle('light-theme');
  themeToggle.textContent = isLight ? 'Light Mode' : 'Dark Mode';
  localStorage.setItem('naijashield-theme', isLight ? 'light' : 'dark');
});

chatAssistant.addEventListener('click', () => {
  chatModal.classList.add('active');
  chatModal.setAttribute('aria-hidden', 'false');
});

chatClose.addEventListener('click', () => {
  chatModal.classList.remove('active');
  chatModal.setAttribute('aria-hidden', 'true');
});

chatModal.addEventListener('click', (event) => {
  if (event.target === chatModal) {
    chatModal.classList.remove('active');
    chatModal.setAttribute('aria-hidden', 'true');
  }
});

const animateCounters = () => {
  const counters = document.querySelectorAll('.metric-number');
  counters.forEach((counter) => {
    const target = parseFloat(counter.dataset.target);
    const duration = 1800;
    const start = 0;
    let startTime = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = start + (target - start) * progress;
      counter.textContent = target % 1 === 0 ? Math.floor(current) : current.toFixed(1);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  });
};

const animateThreatCount = () => {
  const threatCount = document.getElementById('threatCount');
  const value = 1482;
  const duration = 2000;
  let startTime = null;

  const tick = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = Math.floor(progress * value);
    threatCount.textContent = current.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
};

window.addEventListener('load', () => {
  animateCounters();
  animateThreatCount();
});

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('Thank you! Your message has been sent to NaijaShield.');
    contactForm.reset();
  });
}

const chatForm = document.querySelector('.chat-input');
if (chatForm) {
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('NaijaShield AI is reviewing your request and will connect you with security support shortly.');
    chatModal.classList.remove('active');
    chatModal.setAttribute('aria-hidden', 'true');
    chatForm.reset();
  });
}
