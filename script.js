/* Static storefront. Product source and image mapping live in products.js.
   The WhatsApp number is retained from the original website. */
(() => {
  'use strict';
  const WHATSAPP_NUMBER = '51930335733';
  // Pega aquí los enlaces de tus perfiles. Se activarán automáticamente.
  const SOCIAL_LINKS = {
    instagram: '',
    tiktok: '',
    facebook: ''
  };
  const STORAGE_KEY = 'corrySportCartV2';
  const products = window.CORRY_PRODUCTS;
  const byId = new Map(products.map(product => [product.id, product]));
  const categories = [...new Set(products.map(product => product.category))];
  const $ = selector => document.querySelector(selector);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => `S/ ${value.toFixed(2)}`;
  const state = {category:'Todos',search:'',sort:'catalog',limit:12,cart:readCart()};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let revealObserver;
  let toastTimer;
  let addFeedbackTimer;

  function animateAddedProduct(product) {
    const addButton = $('#detailForm button[type="submit"]');
    const orderLink = $('[data-view-order]');
    clearTimeout(addFeedbackTimer);
    addButton.innerHTML = 'Añadido a tu pedido <span aria-hidden="true">✓</span>';
    addButton.classList.add('is-added');
    addFeedbackTimer = setTimeout(() => {
      if (addButton.isConnected) {
        addButton.innerHTML = 'Agregar a mi pedido <span aria-hidden="true">+</span>';
        addButton.classList.remove('is-added');
      }
    }, 1500);
    if (reducedMotion.matches || typeof addButton.animate !== 'function') return;
    [$('#viewCartBtn'), $('#cartCount'), orderLink].forEach(element => {
      element.getAnimations().forEach(animation => animation.cancel());
      element.animate([{transform:'scale(1)'},{transform:'scale(1.045)'},{transform:'scale(1)'}], {duration:500,easing:'cubic-bezier(.2,.7,.2,1)'});
    });
    const from = addButton.getBoundingClientRect();
    const to = orderLink.getBoundingClientRect();
    const dialog = $('#productDialog');
    const rect = dialog.getBoundingClientRect();
    const flight = document.createElement('span');
    flight.className = 'cart-flight';
    flight.setAttribute('aria-hidden','true');
    const thumbnail = new Image();
    thumbnail.src = product.image;
    thumbnail.alt = '';
    flight.append(thumbnail);
    const startX = from.right - 40;
    const startY = from.top + from.height / 2;
    flight.style.left = `${startX - rect.left - 20}px`;
    flight.style.top = `${startY - rect.top - 20 + dialog.scrollTop}px`;
    dialog.append(flight);
    const dx = to.left + 22 - startX;
    const dy = to.top + to.height / 2 - startY;
    const animation = flight.animate([
      {transform:'translate(0,0) scale(.7)',opacity:0},
      {transform:'translate(0,-14px) scale(1)',opacity:1,offset:.22},
      {transform:`translate(${dx}px,${dy}px) scale(.35)`,opacity:0}
    ], {duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
    animation.onfinish = () => flight.remove();
    animation.oncancel = () => flight.remove();
  }

  function readCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      const result = [];
      saved.slice(0,124).forEach(item => {
        const product = item && byId.get(item.id);
        if (!product || !product.sizes.includes(item.size) || !Number.isInteger(item.quantity) || item.quantity < 1) return;
        const existing = result.find(row => row.id === item.id && row.size === item.size);
        if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
        else result.push({id:item.id,size:item.size,quantity:Math.min(99,item.quantity)});
      });
      return result;
    } catch { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); }
    catch { notify('Tu pedido sigue disponible en esta pestaña; el navegador no permite guardarlo.'); }
  }
  function notify(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3200);
  }
  function reveal() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    if (!revealObserver) revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('pending'); revealObserver.unobserve(entry.target); }
      });
    }, {threshold:.07});
    document.querySelectorAll('.reveal:not([data-observed])').forEach((element) => {
      element.dataset.observed = 'true';
      element.classList.add('pending');
      revealObserver.observe(element);
    });
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      revealObserver?.disconnect();
      document.querySelectorAll('.pending').forEach(element => element.classList.remove('pending'));
    }
  });
  function filteredProducts() {
    const query = normalize(state.search);
    const result = products.filter(product => (state.category === 'Todos' || product.category === state.category) && normalize(`${product.name} ${product.category} ${product.id} ${product.color}`).includes(query));
    if (state.sort === 'price-asc') result.sort((a,b) => a.price-b.price);
    if (state.sort === 'price-desc') result.sort((a,b) => b.price-a.price);
    if (state.sort === 'name') result.sort((a,b) => a.name.localeCompare(b.name,'es'));
    return result;
  }
  function renderFilters() {
    $('#filterPills').innerHTML = ['Todos',...categories].map(category => {
      const count = category === 'Todos' ? products.length : products.filter(p => p.category === category).length;
      return `<button class="pill${category === state.category ? ' active' : ''}" data-category="${category}" aria-pressed="${category === state.category}">${category}<span>${count}</span></button>`;
    }).join('');
  }
  function renderProducts() {
    revealObserver?.disconnect();
    document.querySelectorAll('.reveal.pending').forEach(element => { delete element.dataset.observed; });
    const filtered = filteredProducts();
    const visible = filtered.slice(0,state.limit);
    $('#productGrid').innerHTML = visible.map(product => `
      <article class="product-card reveal">
        <button class="product-photo" data-product="${product.id}" aria-label="Ver ${escapeHtml(product.name)} (${product.id})"><span class="product-code">${product.id}</span><img src="${product.image}" alt="${escapeHtml(product.name)}" width="${product.width}" height="${product.height}" loading="lazy" decoding="async"></button>
        <div class="product-info"><div class="product-meta"><span>${product.category}</span><span><i class="color-dot" aria-hidden="true"></i>${product.color}</span></div><h3><button data-product="${product.id}">${product.name}</button></h3><p class="sizes-note">Tallas S · M · L · XL</p><div class="card-bottom"><span class="price">${money(product.price)} <small>/ un.</small></span><button class="add-btn" data-product="${product.id}" aria-label="Elegir talla de ${escapeHtml(product.name)} (${product.id})">+</button></div></div>
      </article>`).join('');
    $('#resultCount').innerHTML = `<strong>${filtered.length} ${filtered.length === 1 ? 'producto' : 'productos'}</strong> ${filtered.length > visible.length ? `· Mostrando ${visible.length}` : '· ' + state.category}`;
    $('#emptyState').hidden = filtered.length !== 0;
    $('#showMoreBtn').hidden = filtered.length <= visible.length;
    $('#showMoreBtn').innerHTML = `Ver más productos (${Math.max(0,filtered.length-visible.length)}) <span aria-hidden="true">↓</span>`;
    document.querySelectorAll('[data-category]').forEach(button => {
      const active = button.dataset.category === state.category;
      button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active));
    });
    reveal();
  }
  function openProduct(id) {
    const p = byId.get(id);
    if (!p) return;
    $('#productDetail').innerHTML = `<div class="detail-grid"><div class="detail-photo"><img src="${p.image}" alt="${escapeHtml(p.name)}" width="${p.width}" height="${p.height}"></div><form class="detail-info" id="detailForm" data-id="${id}" data-selected-size=""><p class="eyebrow">${p.category.toUpperCase()} / ${id}</p><h2 id="detailTitle">${p.name}</h2><span class="price">${money(p.price)} <small>/ unidad</small></span><p><i class="color-dot" aria-hidden="true"></i> Color: ${p.color}</p><fieldset class="size-fieldset"><legend>Selecciona tu talla</legend><div class="size-options">${p.sizes.map(size => `<label class="size-option"><input type="radio" name="size" value="${size}" required><span>${size}</span></label>`).join('')}</div><button class="clear-size" type="button" data-clear-size>Quitar selección</button></fieldset><button class="btn primary" type="submit">Agregar a mi pedido <span aria-hidden="true">+</span></button><div class="detail-feedback" role="status" aria-live="polite"><p id="detailFeedback"></p><button class="text-link" type="button" data-view-order hidden>Ver mi pedido ↗</button></div><p class="detail-note">Precio referencial del catálogo 2025. Consulta medidas, disponibilidad y precio actual por WhatsApp.</p></form></div>`;
    $('#productDialog').showModal();
    $('#productDialog').scrollTop = 0;
  }
  function addItem(id,size) {
    const item = state.cart.find(row => row.id === id && row.size === size);
    if (item?.quantity === 99) { notify('Máximo 99 unidades por producto y talla.'); return; }
    if (item) item.quantity++;
    else state.cart.push({id,size,quantity:1});
    saveCart(); renderCart();
    $('#detailFeedback').textContent = `Añadido a tu pedido: talla ${size}. Puedes seguir eligiendo tallas de este producto.`;
    $('[data-view-order]').hidden = false;
    $('[data-view-order]').innerHTML = `<svg class="bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>Mi pedido <span class="detail-order-count">${state.cart.reduce((sum,row)=>sum+row.quantity,0)}</span><span aria-hidden="true">↗</span>`;
    $('#viewCartBtn').classList.add('has-items');
    animateAddedProduct(byId.get(id));
  }
  function renderCart(anchor = null) {
    const previousScroll = $('#cartItems').scrollTop;
    const quantity = state.cart.reduce((sum,row) => sum+row.quantity,0);
    $('#cartCount').textContent = quantity;
    $('#viewCartBtn').setAttribute('aria-label',`Mi pedido: ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'}`);
    $('#viewCartBtn').classList.toggle('has-items',quantity > 0);
    $('#cartItems').innerHTML = state.cart.length ? state.cart.map((row,index) => {
      const p = byId.get(row.id);
      return `<article class="cart-item" data-cart-key="${row.id}-${row.size}"><img src="${p.image}" width="65" height="90" alt="${escapeHtml(p.name)}"><div><h3>${p.name}</h3><p>${row.id} · Negro · ${money(p.price)} / un.</p><div class="cart-controls"><select data-cart-size="${index}" aria-label="Talla de ${escapeHtml(p.name)}">${p.sizes.map(size => `<option ${size === row.size ? 'selected' : ''}>${size}</option>`).join('')}</select><div class="quantity"><button data-quantity="${index}" data-delta="-1" aria-label="Reducir cantidad de ${escapeHtml(p.name)}" ${row.quantity <= 1 ? 'disabled' : ''}>−</button><span>${row.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="Aumentar cantidad de ${escapeHtml(p.name)}" ${row.quantity >= 99 ? 'disabled' : ''}>+</button></div><button class="remove-btn" data-remove="${index}" aria-label="Quitar ${escapeHtml(p.name)}, talla ${row.size}">Quitar</button></div></div></article>`;
    }).join('') : '<div class="cart-empty"><p>Tu próximo movimiento empieza con una elección.</p><p>Agrega productos del catálogo para preparar tu pedido.</p><button class="text-link" data-close-dialog>Seguir explorando →</button></div>';
    $('#cartTotal').textContent = money(state.cart.reduce((sum,row) => sum+byId.get(row.id).price*row.quantity,0));
    $('#checkoutBtn').disabled = !state.cart.length;
    $('#clearCartBtn').disabled = !state.cart.length;
    if (anchor) {
      const item = $(`[data-cart-key="${anchor.key}"]`);
      $('#cartItems').scrollTop = item ? $('#cartItems').scrollTop + item.getBoundingClientRect().top - anchor.top : previousScroll;
    } else $('#cartItems').scrollTop = previousScroll;
  }
  function cartAnchor(index, size = state.cart[index].size) {
    const row = state.cart[index];
    return {key:`${row.id}-${size}`,top:$(`[data-cart-key="${row.id}-${row.size}"]`).getBoundingClientRect().top};
  }
  function openWhatsApp(message) {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank','noopener,noreferrer');
  }
  function checkout() {
    if (!state.cart.length) return;
    const lines = state.cart.map(row => {
      const p = byId.get(row.id);
      return `${row.quantity} × ${p.name} (${row.id})\nTalla: ${row.size} · Color: ${p.color}\nPrecio referencial: ${money(p.price)} / unidad`;
    });
    const total = state.cart.reduce((sum,row) => sum+byId.get(row.id).price*row.quantity,0);
    openWhatsApp(`Hola CORRY SPORT, quisiera consultar este pedido:\n\n${lines.join('\n\n')}\n\nTotal referencial: ${money(total)}\n¿Me confirman precio actual, tallas, disponibilidad y forma de entrega?`);
  }
  function closeMenu(restoreFocus=false) {
    $('#navLinks').classList.remove('open');
    $('#menuBtn').setAttribute('aria-expanded','false');
    $('#menuBtn').setAttribute('aria-label','Abrir menú');
    if (restoreFocus) $('#menuBtn').focus();
  }
  document.addEventListener('click', event => {
    const sizeInput = event.target.closest('#detailForm input[name="size"]');
    if (sizeInput) {
      const form = sizeInput.closest('form');
      const deselect = form.dataset.selectedSize === sizeInput.value;
      sizeInput.checked = !deselect;
      form.dataset.selectedSize = deselect ? '' : sizeInput.value;
      $('#detailFeedback').textContent = '';
      $('[data-view-order]').hidden = true;
    }
    if (event.target.closest('[data-clear-size]')) {
      document.querySelectorAll('#detailForm input[name="size"]').forEach(input => {input.checked=false;});
      $('#detailForm').dataset.selectedSize = '';
      $('#detailFeedback').textContent = 'Selección de talla eliminada.';
      $('[data-view-order]').hidden = true;
    }
    if (event.target.closest('[data-view-order]')) {
      $('#productDialog').close();
      renderCart();
      $('#cartDialog').showModal();
    }
    const category = event.target.closest('[data-category]');
    if (category) { state.category = category.dataset.category; state.limit=12; renderProducts(); }
    const product = event.target.closest('[data-product],[data-feature]');
    if (product) { event.preventDefault(); openProduct(product.dataset.product || product.dataset.feature); }
    const close = event.target.closest('[data-close-dialog]');
    if (close) close.closest('dialog').close();
    const quantity = event.target.closest('[data-quantity]');
    if (quantity) {
      const index = Number(quantity.dataset.quantity), delta = Number(quantity.dataset.delta);
      const anchor = cartAnchor(index);
      state.cart[index].quantity = Math.max(1,Math.min(99,state.cart[index].quantity+delta));
      saveCart(); renderCart(anchor);
      const target = $(`[data-quantity="${index}"][data-delta="${delta}"]`);
      (target.disabled ? $(`[data-cart-size="${index}"]`) : target).focus({preventScroll:true});
    }
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      const index = Number(remove.dataset.remove);
      state.cart.splice(index,1); saveCart(); renderCart();
      ($('#cartItems [data-remove]') || $('#cartDialog [data-close-dialog]')).focus();
    }
    if (!event.target.closest('.nav')) closeMenu();
  });
  $('#productDetail').addEventListener('change',event => {
    if (event.target.matches('input[name="size"]') && event.target.checked) {
      $('#detailForm').dataset.selectedSize = event.target.value;
      $('#detailFeedback').textContent = '';
      $('[data-view-order]').hidden = true;
    }
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'detailForm') {
      event.preventDefault(); const size = new FormData(event.target).get('size');
      if (byId.get(event.target.dataset.id)?.sizes.includes(size)) addItem(event.target.dataset.id,size);
    }
  });
  $('#cartItems').addEventListener('change', event => {
    if (!event.target.matches('[data-cart-size]')) return;
    const index = Number(event.target.dataset.cartSize), size = event.target.value, row = state.cart[index];
    const anchor = cartAnchor(index,size);
    const duplicate = state.cart.find((other,i) => i !== index && other.id === row.id && other.size === size);
    if (duplicate && duplicate.quantity+row.quantity > 99) {
      event.target.value = row.size; notify('La talla seleccionada superaría 99 unidades. Ajusta primero la cantidad.'); return;
    }
    row.size = size;
    if (duplicate) { row.quantity += duplicate.quantity; state.cart.splice(state.cart.indexOf(duplicate),1); }
    saveCart(); renderCart(anchor);
    const newIndex = state.cart.findIndex(item => item.id === row.id && item.size === size);
    $(`[data-cart-size="${newIndex}"]`).focus({preventScroll:true});
  });
  $('#searchInput').addEventListener('input', event => {state.search=event.target.value;state.limit=12;renderProducts();});
  $('#sortSelect').addEventListener('change', event => {state.sort=event.target.value;state.limit=12;renderProducts();});
  $('#resetFilters').addEventListener('click', () => {state.category='Todos';state.search='';state.limit=12;$('#searchInput').value='';renderProducts();$('#searchInput').focus();});
  $('#showMoreBtn').addEventListener('click', () => {
    const previousCount = Math.min(state.limit,filteredProducts().length);
    state.limit += 12; renderProducts();
    document.querySelectorAll('.product-photo')[previousCount]?.focus({preventScroll:true});
  });
  $('#viewCartBtn').addEventListener('click', () => {renderCart();$('#cartDialog').showModal();});
  $('#checkoutBtn').addEventListener('click',checkout);
  $('#clearCartBtn').addEventListener('click',() => {state.cart=[];saveCart();renderCart();$('#cartDialog [data-close-dialog]').focus();});
  $('#menuBtn').addEventListener('click', () => {
    const opened = $('#navLinks').classList.toggle('open');
    $('#menuBtn').setAttribute('aria-expanded',String(opened));
    $('#menuBtn').setAttribute('aria-label',opened ? 'Cerrar menú' : 'Abrir menú');
  });
  $('#navLinks').addEventListener('click', event => {if(event.target.closest('a')) closeMenu();});
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#menuBtn').getAttribute('aria-expanded') === 'true') closeMenu(true);
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.matches('input,textarea,select,[contenteditable]') && !document.querySelector('dialog[open]')) {event.preventDefault();$('#searchInput').focus();}
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],textarea:not(:disabled)')].filter(element => element.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {event.preventDefault();last?.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
    });
    dialog.addEventListener('click',event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
  $('#contactForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#contactName'), message = $('#contactMessage');
    name.setCustomValidity(name.value.trim() ? '' : 'Escribe tu nombre.');
    message.setCustomValidity(message.value.trim() ? '' : 'Cuéntanos qué estás buscando.');
    if (!event.target.reportValidity()) return;
    openWhatsApp(`Hola CORRY SPORT, soy ${name.value.trim()}.\n\n${message.value.trim()}`);
  });
  $('#contactForm').addEventListener('input',event => event.target.setCustomValidity(''));
  $('#year').textContent = new Date().getFullYear();
  document.querySelectorAll('[data-social]').forEach(link => {
    const url = SOCIAL_LINKS[link.dataset.social].trim();
    if (/^https:\/\//i.test(url)) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.removeAttribute('aria-disabled');
    } else link.title = 'Próximamente';
  });
  renderFilters(); renderProducts(); renderCart(); reveal();
})();
