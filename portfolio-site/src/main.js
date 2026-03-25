import './style.css'

const navToggle = document.querySelector('.nav-toggle')
const navList = document.querySelector('#navList')
const yearEl = document.querySelector('#year')
const versionSelect = document.querySelector('#versionSelect')
const navLinks = navList ? Array.from(navList.querySelectorAll('a')) : []
const sections = Array.from(document.querySelectorAll('main .section'))

function setCurrentYear() {
  if (yearEl) yearEl.textContent = new Date().getFullYear()
}

function toggleNav() {
  if (!navToggle || !navList) return
  const expanded = navToggle.getAttribute('aria-expanded') === 'true'
  navToggle.setAttribute('aria-expanded', String(!expanded))
  navList.classList.toggle('is-open', !expanded)
}

function closeNav() {
  if (!navToggle || !navList) return
  navToggle.setAttribute('aria-expanded', 'false')
  navList.classList.remove('is-open')
}

function setActiveSection(id) {
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#${id}`
    link.classList.toggle('active', active)
  })
}

function initSectionObserver() {
  if (!sections.length || !navLinks.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        setActiveSection(entry.target.id)
      })
    },
    {
      root: null,
      rootMargin: '-35% 0px -45% 0px',
      threshold: 0.01,
    },
  )

  sections.forEach((section) => {
    observer.observe(section)
  })
}

function initVersionSwitch() {
  if (!versionSelect) return

  versionSelect.addEventListener('change', () => {
    const selected = versionSelect.value;
    // Always use the correct subpath for GitHub Pages deployment
    const base = '/my-jobhunt-portfolio/';
    if (selected === 'v1') {
      window.location.href = base + 'version-1.html';
      return;
    }
    if (selected === 'v2') {
      window.location.href = base + 'index.html';
      return;
    }
    if (selected === 'v3') {
      window.location.href = base + 'version-3.html';
      return;
    }
    window.location.href = base + 'index.html';
  });
}

function init() {
  setCurrentYear()
  navToggle?.addEventListener('click', toggleNav)
  navLinks.forEach((link) => {
    link.addEventListener('click', closeNav)
  })

  if (sections[0]) setActiveSection(sections[0].id)
  initSectionObserver()
  initVersionSwitch()
}

init()
