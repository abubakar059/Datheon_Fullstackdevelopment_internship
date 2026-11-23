const portfolio = document.querySelector('.portfolio')
const themeToggle = document.querySelector('.theme-toggle')
const menuToggle = document.querySelector('.menu-toggle')
const mainNav = document.querySelector('.main-nav')
const projectDialog = document.querySelector('.project-dialog')

const projects = {
  'jcm-two': {
    name: 'JCM Two',
    category: 'FLOWER SHOP',
    image: '/projects/jcm-two.png',
    description: 'An elegant flower shop showcasing seasonal bouquets and thoughtful floral arrangements for everyday moments and special occasions.',
    tags: ['Floristry', 'Bouquets', 'E-commerce'],
    url: 'https://jcm-two.vercel.app',
  },
  'kalsoom-beauty': {
    name: 'Kalsoom Beauty',
    category: 'BEAUTY SALON',
    image: '/projects/kalsoom-beauty.png',
    description: 'A welcoming ladies’ salon offering hair, makeup, skin, and nail services in a polished, easy-to-explore online experience.',
    tags: ['Beauty', 'Salon', 'Appointments'],
    url: 'https://kalsoombeauty.vercel.app',
  },
  'mcr-gray': {
    name: 'MCR Gray',
    category: 'PHYSIOTHERAPY CENTER',
    image: '/projects/mcr-gray.png',
    description: 'A modern physiotherapy center helping people move with confidence through personalized treatment, injury recovery, and expert care.',
    tags: ['Physiotherapy', 'Rehabilitation', 'Patient care'],
    url: 'https://mcr-gray.vercel.app',
  },
  'lepro-wellness': {
    name: 'Lepro Wellness Center',
    category: 'PHYSIOTHERAPY & WELLNESS',
    image: '/projects/lepro-wellness.png',
    description: 'A physiotherapy and wellness center bringing movement-focused care, recovery services, and whole-person support together.',
    tags: ['Physiotherapy', 'Wellness', 'Recovery'],
    url: 'https://leprowellnesscenter.ca',
  },
}

function setTheme(theme) {
  portfolio.dataset.theme = theme
  document.documentElement.dataset.theme = theme
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`)
  themeToggle.querySelector('span').textContent = nextTheme.toUpperCase()
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#13171b' : '#f1f0e9'
}

themeToggle.addEventListener('click', () => {
  setTheme(portfolio.dataset.theme === 'dark' ? 'light' : 'dark')
})

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!isOpen))
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu')
  mainNav.classList.toggle('is-open', !isOpen)
})

mainNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuToggle.setAttribute('aria-expanded', 'false')
    menuToggle.setAttribute('aria-label', 'Open navigation menu')
    mainNav.classList.remove('is-open')
  }
})

document.querySelectorAll('.project-open').forEach((button) => {
  button.addEventListener('click', () => {
    const project = projects[button.dataset.project]
    if (!project) return

    const image = projectDialog.querySelector('.dialog-image')
    image.src = project.image
    image.alt = `${project.name} website preview`
    projectDialog.querySelector('.dialog-category').textContent = project.category
    projectDialog.querySelector('#dialog-title').textContent = project.name
    projectDialog.querySelector('.dialog-description').textContent = project.description
    projectDialog.querySelector('.modal-visit').href = project.url

    const tags = projectDialog.querySelector('.dialog-tags')
    tags.replaceChildren(...project.tags.map((tag) => {
      const element = document.createElement('span')
      element.textContent = tag
      return element
    }))

    projectDialog.showModal()
  })
})

projectDialog.addEventListener('click', (event) => {
  if (event.target === projectDialog) projectDialog.close()
})

const projectCards = document.querySelectorAll('.project-card')
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        currentObserver.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' })

  projectCards.forEach((card) => observer.observe(card))
} else {
  projectCards.forEach((card) => card.classList.add('is-visible'))
}
