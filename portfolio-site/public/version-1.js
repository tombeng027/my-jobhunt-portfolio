const navToggle = document.querySelector('.nav-toggle')
const navList = document.querySelector('#navList')
const yearEl = document.querySelector('#year')
const versionSelect = document.querySelector('#versionSelectV1')

function setCurrentYear() {
  if (yearEl) yearEl.textContent = new Date().getFullYear()
}

function toggleNav() {
  if (!navToggle || !navList) return
  const expanded = navToggle.getAttribute('aria-expanded') === 'true'
  navToggle.setAttribute('aria-expanded', String(!expanded))
  navList.classList.toggle('is-open')
}

function setActiveFilter(button) {
  document.querySelectorAll('.filter-button').forEach((btn) => {
    btn.classList.toggle('active', btn === button)
  })
}

function filterProjects(category) {
  const projects = document.querySelectorAll('.project')
  projects.forEach((project) => {
    const projectCategory = project.getAttribute('data-category') ?? 'all'
    const isVisible = category === 'all' || projectCategory === category
    project.style.display = isVisible ? '' : 'none'
  })
}

function initProjectFilters() {
  const buttons = document.querySelectorAll('.filter-button')
  if (!buttons.length) return

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-filter') ?? 'all'
      setActiveFilter(button)
      filterProjects(category)
    })
  })
}

function initVersionSwitch() {
  if (!versionSelect) return

  versionSelect.addEventListener('change', () => {
    const selected = versionSelect.value
    if (selected === 'v2') {
      window.location.href = './'
      return
    }

    window.location.href = './version-1.html'
  })
}

function init() {
  setCurrentYear()
  navToggle?.addEventListener('click', toggleNav)
  navList?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navList.classList.remove('is-open'))
  })

  initProjectFilters()
  filterProjects('all')
  initVersionSwitch()
}

init()
