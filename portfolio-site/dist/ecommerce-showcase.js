let products = []

const productGrid = document.querySelector('#productGrid')
const resultsCount = document.querySelector('#resultsCount')
const searchInput = document.querySelector('#searchInput')
const categoryFilter = document.querySelector('#categoryFilter')
const sortFilter = document.querySelector('#sortFilter')
const cartItems = document.querySelector('#cartItems')
const cartStatus = document.querySelector('#cartStatus')
const subtotalValue = document.querySelector('#subtotalValue')
const shippingValue = document.querySelector('#shippingValue')
const totalValue = document.querySelector('#totalValue')
const checkoutButton = document.querySelector('#checkoutButton')
const checkoutNote = document.querySelector('#checkoutNote')

const STORAGE_KEY = 'portfolio.ecommerce.cart'
const PRODUCTS_CACHE_KEY = 'portfolio.ecommerce.products_cache'
const cart = new Map()

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function getFilteredProducts() {
  const category = categoryFilter?.value || 'all'
  const sort = sortFilter?.value || 'featured'
  const query = (searchInput?.value || '').trim().toLowerCase()

  let list = products.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)

    return matchesCategory && matchesQuery
  })

  if (sort === 'lowToHigh') {
    list = list.sort((a, b) => a.price - b.price)
  }

  if (sort === 'highToLow') {
    list = list.sort((a, b) => b.price - a.price)
  }

  return list
}

function renderProducts() {
  if (!productGrid || !resultsCount) return

  const list = getFilteredProducts()
  resultsCount.textContent = `${list.length} product${list.length === 1 ? '' : 's'} found`

  if (!list.length) {
    productGrid.innerHTML = '<p class="empty-state">No products match the selected filter.</p>'
    return
  }

  productGrid.innerHTML = list
    .map(
      (item) => `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${item.image}" alt="${item.name}" loading="lazy" />
        </div>
        <p class="product-category">${item.category}</p>
        <h3>${item.name}</h3>
        <p class="product-description">${item.description}</p>
        <div class="meta">
          <span>${formatCurrency(item.price)}</span>
          <span>${item.badge}</span>
        </div>
        <p class="stock-note">Stock: ${item.stock}</p>
        <button type="button" class="add-button" data-product-id="${item.id}">Add to Cart</button>
      </article>
    `,
    )
    .join('')
}

function getProductById(productId) {
  return products.find((product) => product.id === productId)
}

function saveCart() {
  const entries = Array.from(cart.entries())
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return

    parsed.forEach((entry) => {
      if (!Array.isArray(entry) || entry.length !== 2) return
      const [id, quantity] = entry
      const product = getProductById(id)
      if (!product || typeof quantity !== 'number' || quantity <= 0) return
      cart.set(id, Math.min(quantity, product.stock))
    })
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function setCartStatus(message) {
  if (!cartStatus) return
  cartStatus.textContent = message
}

function renderCart() {
  if (!cartItems || !subtotalValue || !shippingValue || !totalValue) return

  const entries = Array.from(cart.entries())

  if (!entries.length) {
    cartItems.innerHTML = '<p class="empty-state">Your cart is empty.</p>'
    subtotalValue.textContent = formatCurrency(0)
    shippingValue.textContent = formatCurrency(0)
    totalValue.textContent = formatCurrency(0)
    return
  }

  const subtotal = entries.reduce((sum, [id, quantity]) => {
    const item = getProductById(id)
    return item ? sum + item.price * quantity : sum
  }, 0)

  const shipping = subtotal >= 250 ? 0 : 12
  const total = subtotal + shipping

  cartItems.innerHTML = entries
    .map(([id, quantity]) => {
      const item = getProductById(id)
      if (!item) return ''

      return `
        <div class="cart-item">
          <div>
            <p class="cart-item-name">${item.name}</p>
            <p class="cart-item-price">${formatCurrency(item.price)}</p>
          </div>
          <div class="qty-controls">
            <button type="button" class="qty-button" data-action="decrease" data-product-id="${item.id}">−</button>
            <span>${quantity}</span>
            <button type="button" class="qty-button" data-action="increase" data-product-id="${item.id}">+</button>
          </div>
        </div>
      `
    })
    .join('')

  subtotalValue.textContent = formatCurrency(subtotal)
  shippingValue.textContent = formatCurrency(shipping)
  totalValue.textContent = formatCurrency(total)
}

function addToCart(productId) {
  const product = getProductById(productId)
  if (!product) return

  const current = cart.get(productId) || 0
  if (current >= product.stock) {
    setCartStatus(`${product.name} has reached max available stock (${product.stock}).`)
    return
  }

  cart.set(productId, current + 1)
  setCartStatus(`${product.name} added to cart.`)
  saveCart()
  renderCart()
}

function updateQuantity(productId, action) {
  const current = cart.get(productId)
  if (!current) return

  const product = getProductById(productId)
  if (!product) return

  if (action === 'decrease') {
    const next = current - 1
    if (next <= 0) {
      cart.delete(productId)
      setCartStatus(`${product.name} removed from cart.`)
    } else {
      cart.set(productId, next)
      setCartStatus(`${product.name} quantity updated.`)
    }
  }

  if (action === 'increase') {
    if (current >= product.stock) {
      setCartStatus(`${product.name} has reached max available stock (${product.stock}).`)
      return
    }

    cart.set(productId, current + 1)
    setCartStatus(`${product.name} quantity updated.`)
  }

  saveCart()
  renderCart()
}

function handleGridClick(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const addButton = target.closest('.add-button')
  if (!(addButton instanceof HTMLButtonElement)) return

  const productId = addButton.dataset.productId
  if (!productId) return

  addToCart(productId)
}

function handleCartClick(event) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const qtyButton = target.closest('.qty-button')
  if (!(qtyButton instanceof HTMLButtonElement)) return

  const productId = qtyButton.dataset.productId
  const action = qtyButton.dataset.action
  if (!productId || !action) return

  updateQuantity(productId, action)
}

function handleCheckout() {
  checkoutNote.textContent = cart.size
    ? 'Checkout flow simulated successfully. This is a front-end showcase demo.'
    : 'Add at least one item to the cart before proceeding to checkout.'
}

function setLoadingState() {
  if (!productGrid) return
  productGrid.innerHTML = '<p class="empty-state">Loading products…</p>'
  if (resultsCount) resultsCount.textContent = ''
}

function setErrorState(message) {
  if (!productGrid) return
  productGrid.innerHTML = `<p class="empty-state">${message}</p>`
  if (resultsCount) resultsCount.textContent = ''
}

function mapProduct(raw) {
  const stock = Math.max(1, raw.rating.count % 15 + 1)
  const description =
    raw.description.length > 110 ? raw.description.slice(0, 110) + '…' : raw.description
  return {
    id: String(raw.id),
    name: raw.title,
    category: raw.category,
    description,
    price: raw.price,
    image: raw.image,
    badge: stock <= 3 ? 'Limited stock' : 'In stock',
    stock,
  }
}

function saveProductsCache(mapped) {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(mapped))
  } catch {
    // storage quota exceeded — skip caching
  }
}

function loadProductsCache() {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : null
  } catch {
    return null
  }
}

async function fetchProducts() {
  setLoadingState()
  try {
    const response = await fetch('https://fakestoreapi.com/products')
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const data = await response.json()
    products = data.map(mapProduct)
    saveProductsCache(products)
    renderProducts()
    renderCart()
  } catch (err) {
    console.error('FakeStore API error:', err)
    const cached = loadProductsCache()
    if (cached) {
      products = cached
      setCartStatus('Using cached product data — API unavailable.')
      renderProducts()
      renderCart()
    } else {
      setErrorState('Failed to load products. Please try again later.')
    }
  }
}

function populateCategoryFilter(categories) {
  if (!categoryFilter) return
  categoryFilter.innerHTML = '<option value="all">All</option>'
  categories.forEach((cat) => {
    const option = document.createElement('option')
    option.value = cat
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1)
    categoryFilter.appendChild(option)
  })
}

async function fetchCategories() {
  try {
    const response = await fetch('https://fakestoreapi.com/products/categories')
    if (!response.ok) throw new Error('Categories API error')
    const categories = await response.json()
    populateCategoryFilter(categories)
  } catch {
    // fall back to unique categories from cached products if available
    const cached = loadProductsCache()
    if (cached) {
      const unique = [...new Set(cached.map((p) => p.category))]
      populateCategoryFilter(unique)
    }
    // silently fail — "All" option still works even without categories
  }
}

function init() {
  loadCart()
  renderCart()

  searchInput?.addEventListener('input', renderProducts)
  categoryFilter?.addEventListener('change', renderProducts)
  sortFilter?.addEventListener('change', renderProducts)
  productGrid?.addEventListener('click', handleGridClick)
  cartItems?.addEventListener('click', handleCartClick)
  checkoutButton?.addEventListener('click', handleCheckout)

  fetchCategories()
  fetchProducts()
}

init()
