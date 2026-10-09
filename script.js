/* Static storefront. Product source and image mapping live in products.js.
   The WhatsApp number is retained from the original website. */
(() => {
  'use strict';
  const WHATSAPP_NUMBER = '51930335733';
  // Perfiles oficiales de CORRY SPORT proporcionados por el propietario.
  const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/corry_sport/',
    tiktok: 'https://www.tiktok.com/@corry_sport?_r=1&_t=ZS-9AOwHonPKtg',
    facebook: 'https://www.facebook.com/share/1EbVWknNha/'
  };
  const STORAGE_KEY = 'corrySportCartV2';
  const products = window.CORRY_PRODUCTS;
  const byId = new Map(products.map(product => [product.id, product]));
  const categories = [...new Set(products.map(product => product.category))];
  const $ = selector => document.querySelector(selector);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => `S/ ${value.toFixed(2)}`;
  const initialLimit = Math.max(12, products.filter(p => p.featured).length);
  const hasPrice = p => Number.isFinite(p.price);
  const priceText = p => hasPrice(p) ? money(p.price) : 'Consultar precio';
  const variants = p => p.gallery || [{image:p.image,width:p.width,height:p.height,color:p.color}];
  const colorHex = color => ({Negro:'#202632',Blanco:'#fff',Rojo:'#df1531',Azul:'#1569df','Azul marino':'#172747',Gris:'#8490a3'}[color.split(' / ')[0]] || '#202632');
  const rowKey = (row,size=row.size) => encodeURIComponent(`${row.id}|${size}|${row.color}`);
  let mediaSequence = 0;
  let activeGallery = {id:null,index:0};
  let activeApplication = 0;
  const icon = direction => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${({left:'m15 6-6 6 6 6',right:'m9 6 6 6-6 6',plus:'M12 5v14M5 12h14',minus:'M5 12h14',check:'m5 12 4.5 4.5L19 7',arrow:'M6 18 18 6M6 6h12v12'})[direction]}"/></svg>`;
  function mediaMarkup(p, variant=variants(p)[0]) {
    const alt = `${p.name}${variant.color ? ' · '+variant.color : ''}`;
    if (!variant.crop) return `<img class="media-image" src="${variant.image}" alt="${escapeHtml(alt)}" width="${variant.width}" height="${variant.height}" loading="lazy" decoding="async" draggable="false">`;
    const [x,y,width,height] = variant.crop, clipId = `media-crop-${++mediaSequence}`;
    // Native SVG clipping presents one original photograph, without creating altered raster assets.
    return `<svg class="media-image media-crop" viewBox="${x} ${y} ${width} ${height}" role="img" aria-label="${escapeHtml(alt)}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath></defs><image href="${variant.image}" width="${variant.width}" height="${variant.height}" clip-path="url(#${clipId})"/></svg>`;
  }
  function totalText() {
    const known = state.cart.filter(row => hasPrice(byId.get(row.id)));
    const total = known.reduce((sum,row) => sum+byId.get(row.id).price*row.quantity,0);
    const unknown = state.cart.some(row => !hasPrice(byId.get(row.id)));
    return unknown ? (known.length ? `${money(total)} + por confirmar` : 'Por confirmar') : money(total);
  }
  function sizeNote(p) {
    return p.sizes[0] === 'Por confirmar' ? 'Talla por confirmar' : p.category === 'Cinta' ? p.sizes[0] : `Tallas ${p.sizes.join(' · ')}`;
  }
  const state = {category:'Todos',search:'',sort:'catalog',limit:initialLimit,cart:readCart()};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let revealObserver;
  let toastTimer;
  let addFeedbackTimer;

  function animateAddedProduct(product) {
    const addButton = $('#detailForm button[type="submit"]');
    const orderLink = $('[data-view-order]');
    clearTimeout(addFeedbackTimer);
    addButton.innerHTML = 'Añadido a tu pedido <span aria-hidden="true"><svg class="ui-icon icon-check" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12 4.5 4.5L19 7"/></svg></span>';
    addButton.classList.add('is-added');
    addFeedbackTimer = setTimeout(() => {
      if (addButton.isConnected) {
        addButton.innerHTML = 'Agregar a mi pedido <span aria-hidden="true"><svg class="ui-icon icon-plus" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg></span>';
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
    flight.innerHTML = mediaMarkup(product,variants(product)[activeGallery.index]);
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
        const color = variants(product).some(v => v.color === item.color) ? item.color : product.color;
        const existing = result.find(row => row.id === item.id && row.size === item.size && row.color === color);
        if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
        else result.push({id:item.id,size:item.size,color,quantity:Math.min(99,item.quantity)});
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
    const result = products.filter(product => (state.category === 'Todos' || product.category === state.category) && normalize(`${product.name} ${product.category} ${product.id} ${product.modelCode || ''} ${variants(product).map(v=>v.color).join(' ')}`).includes(query));
    if (state.sort.startsWith('price-')) result.sort((a,b) => hasPrice(a) !== hasPrice(b) ? (hasPrice(a) ? -1 : 1) : hasPrice(a) ? (state.sort === 'price-asc' ? a.price-b.price : b.price-a.price) : 0);
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
    $('#productGrid').innerHTML = visible.map(p => `
      <article class="product-card reveal${p.isNew ? ' new-product' : ''}" data-id="${p.id}">
        <button class="product-photo" data-product="${p.id}" aria-label="Ver detalles de ${escapeHtml(p.name)}"><span class="product-code">${p.modelCode || p.id}</span>${p.isNew ? '<span class="new-label">NUEVO</span>' : ''}<span class="card-media">${mediaMarkup(p)}</span></button>
        <div class="product-info"><div class="product-meta"><span>${p.category}</span><span><i class="color-dot" style="background:${colorHex(p.color)}" aria-hidden="true"></i>${p.gallery ? '5 colores' : p.color}</span></div><h3><button data-product="${p.id}">${p.name}</button></h3><p class="sizes-note">${sizeNote(p)}</p><div class="card-bottom"><span class="price${hasPrice(p) ? '' : ' price-pending'}">${priceText(p)}${hasPrice(p) ? ' <small>/ un.</small>' : ''}</span><button class="add-btn" data-product="${p.id}" aria-label="Ver opciones de ${escapeHtml(p.name)}">${icon('plus')}</button></div><button class="details-link" data-product="${p.id}">Ver detalles ${icon('arrow')}</button></div>
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

  function galleryMarkup(p) {
    const options = variants(p);
    return `<div class="product-gallery${options.length > 1 ? ' has-variants' : ''}"><div class="gallery-heading"><span>${p.gallery ? 'EXPLORA CADA COLOR' : 'VISTA DEL PRODUCTO'}</span><span id="galleryCount">01 / ${String(options.length).padStart(2,'0')}</span></div><div class="detail-photo gallery-stage" id="galleryStage" tabindex="${options.length > 1 ? '0' : '-1'}" role="group" aria-label="Galería de ${escapeHtml(p.name)}"><div class="gallery-media" id="galleryMedia">${mediaMarkup(p)}</div>${options.length > 1 ? `<button type="button" class="gallery-arrow gallery-prev" data-gallery-step="-1" aria-label="Color anterior">${icon('left')}</button><button type="button" class="gallery-arrow gallery-next" data-gallery-step="1" aria-label="Color siguiente">${icon('right')}</button>` : ''}</div>${options.length > 1 ? `<div class="gallery-caption"><span id="galleryColor" aria-live="polite">Negro</span><small>Arrastra o usa las flechas</small></div><div class="color-variants" aria-label="Elegir color">${options.map((v,i)=>`<button type="button" data-gallery-index="${i}" class="color-variant${i===0 ? ' active' : ''}" aria-pressed="${i===0}" aria-label="Ver color ${v.color}"><i style="background:${colorHex(v.color)}"></i><span>${v.color}</span></button>`).join('')}</div>` : ''}${p.video ? `<details class="product-video"><summary>Ver el modelo en movimiento ${icon('arrow')}</summary><video controls playsinline preload="none" aria-label="Demostración de rodillera BRA-103"><source src="${p.video}" type="video/mp4"></video></details>` : ''}</div>`;
  }
  function applicationMarkup(p) {
    if (!p.applications) return '';
    const first = p.applications[0];
    return `<section class="tape-applications" aria-labelledby="applicationsTitle"><div class="applications-heading"><p class="eyebrow">MIRACLE TAPE / REFERENCIAS DE APLICACIÓN</p><h3 id="applicationsTitle">Una cinta.<br><em>Distintas zonas.</em></h3><p>Selecciona una zona para explorar la imagen.</p></div><div class="applications-grid"><div class="application-visual"><div id="applicationMedia">${mediaMarkup({name:first.name},first)}</div><span class="application-caption"><span id="applicationName" aria-live="polite">Rodilla</span><small id="applicationNumber">01 / 09</small></span></div><div class="application-options" role="group" aria-label="Zonas de aplicación">${p.applications.map((v,i)=>`<button type="button" data-application="${i}" class="${i===0 ? 'active' : ''}" aria-pressed="${i===0}"><small>${String(i+1).padStart(2,'0')}</small>${v.name}${icon('arrow')}</button>`).join('')}</div></div></section>`;
  }
  function setGallery(index) {
    const p = byId.get(activeGallery.id), options = variants(p);
    activeGallery.index = (index+options.length)%options.length;
    const v = options[activeGallery.index];
    $('#galleryMedia').innerHTML = mediaMarkup(p,v);
    $('#galleryCount').textContent = `${String(activeGallery.index+1).padStart(2,'0')} / ${String(options.length).padStart(2,'0')}`;
    $('#galleryColor').textContent = v.color;
    $('#detailColor').textContent = v.color;
    $('#detailColorDot').style.background = colorHex(v.color);
    $('#detailForm').dataset.selectedColor = v.color;
    document.querySelectorAll('[data-gallery-index]').forEach(button => {
      const selected = Number(button.dataset.galleryIndex) === activeGallery.index;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
    $('#detailFeedback').textContent = '';
    $('[data-view-order]').hidden = true;
  }
  function setApplication(index) {
    const p = byId.get(activeGallery.id), v = p.applications[index];
    if (!v) return;
    activeApplication = index;
    $('#applicationMedia').innerHTML = mediaMarkup({name:v.name},v);
    $('#applicationName').textContent = v.name;
    $('#applicationNumber').textContent = `${String(index+1).padStart(2,'0')} / 09`;
    document.querySelectorAll('[data-application]').forEach(button => {
      const selected = Number(button.dataset.application) === index;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
  }
  function openProduct(id) {
    const p = byId.get(id);
    if (!p) return;
    activeGallery = {id,index:0}; activeApplication = 0;
    const fixedSize = p.sizes.length === 1;
    const sizeFields = fixedSize ? `<div class="pending-spec"><span>${p.category === 'Cinta' ? 'MEDIDA DEL ROLLO' : 'TALLA'}</span><strong>${p.sizes[0]}</strong><input type="hidden" name="size" value="${escapeHtml(p.sizes[0])}"></div>` : `<fieldset class="size-fieldset"><legend>Selecciona tu talla</legend><div class="size-options">${p.sizes.map(size=>`<label class="size-option"><input type="radio" name="size" value="${size}" required><span>${size}</span></label>`).join('')}</div><button class="clear-size" type="button" data-clear-size>Quitar selección</button></fieldset>`;
    $('#productDetail').innerHTML = `<div class="detail-grid">${galleryMarkup(p)}<form class="detail-info" id="detailForm" data-id="${id}" data-selected-size="" data-selected-color="${escapeHtml(p.color)}"><p class="eyebrow">${p.category.toUpperCase()} / ${p.modelCode || id}</p>${p.isNew ? '<span class="detail-new">NUEVO EN CORRY SPORT</span>' : ''}<h2 id="detailTitle">${p.name}</h2>${p.description ? `<p class="product-description">${p.description}</p>` : ''}<span class="price${hasPrice(p) ? '' : ' price-pending'}">${priceText(p)}${hasPrice(p) ? ' <small>/ unidad</small>' : ''}</span><p class="selected-color"><i class="color-dot" id="detailColorDot" style="background:${colorHex(p.color)}" aria-hidden="true"></i> Color: <strong id="detailColor">${p.color}</strong></p>${sizeFields}<button class="btn primary" type="submit">Agregar a mi pedido <span aria-hidden="true">${icon('plus')}</span></button><div class="detail-feedback" role="status" aria-live="polite"><p id="detailFeedback"></p><button class="text-link" type="button" data-view-order hidden>Ver mi pedido ${icon('arrow')}</button></div><p class="detail-note">${hasPrice(p) ? 'Precio referencial del catálogo 2025. Confirma precio actual y disponibilidad por WhatsApp.' : 'Agrega el producto a tu pedido y consulta precio, talla y disponibilidad por WhatsApp.'}</p></form></div>${applicationMarkup(p)}`;
    $('#productDialog').showModal();
    $('#productDialog').scrollTop = 0;
  }

  function addItem(id,size,color) {
    const item = state.cart.find(row => row.id === id && row.size === size && row.color === color);
    if (item?.quantity === 99) { notify('Máximo 99 unidades por producto, talla y color.'); return; }
    if (item) item.quantity++;
    else state.cart.push({id,size,color,quantity:1});
    saveCart(); renderCart();
    $('#detailFeedback').textContent = `Añadido a tu pedido: ${color} · ${size === 'Por confirmar' ? 'talla por confirmar' : size}.`;
    $('[data-view-order]').hidden = false;
    $('[data-view-order]').innerHTML = `<svg class="bag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>Mi pedido <span class="detail-order-count">${state.cart.reduce((sum,row)=>sum+row.quantity,0)}</span><span aria-hidden="true"><svg class="ui-icon icon-arrow-up-right" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></span>`;
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
      return `<article class="cart-item" data-cart-key="${rowKey(row)}"><span class="cart-media">${mediaMarkup(p,variants(p).find(v=>v.color===row.color) || variants(p)[0])}</span><div><h3>${p.name}</h3><p>${row.id} · ${row.color} · ${priceText(p)}${hasPrice(p) ? ' / un.' : ''}</p><div class="cart-controls"><select data-cart-size="${index}" aria-label="Talla de ${escapeHtml(p.name)}">${p.sizes.map(size => `<option ${size === row.size ? 'selected' : ''}>${size}</option>`).join('')}</select><div class="quantity"><button data-quantity="${index}" data-delta="-1" aria-label="Reducir cantidad de ${escapeHtml(p.name)}" ${row.quantity <= 1 ? 'disabled' : ''}><svg class="ui-icon icon-minus" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg></button><span>${row.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="Aumentar cantidad de ${escapeHtml(p.name)}" ${row.quantity >= 99 ? 'disabled' : ''}><svg class="ui-icon icon-plus" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg></button></div><button class="remove-btn" data-remove="${index}" aria-label="Quitar ${escapeHtml(p.name)}, talla ${row.size}">Quitar</button></div></div></article>`;
    }).join('') : '<div class="cart-empty"><p>Tu próximo movimiento empieza con una elección.</p><p>Agrega productos del catálogo para preparar tu pedido.</p><button class="text-link" data-close-dialog>Seguir explorando <svg class="ui-icon icon-arrow-right" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16M14 6l6 6-6 6"/></svg></button></div>';
    $('#cartTotal').textContent = totalText();
    $('#checkoutBtn').disabled = !state.cart.length;
    $('#clearCartBtn').disabled = !state.cart.length;
    if (anchor) {
      const item = $(`[data-cart-key="${anchor.key}"]`);
      $('#cartItems').scrollTop = item ? $('#cartItems').scrollTop + item.getBoundingClientRect().top - anchor.top : previousScroll;
    } else $('#cartItems').scrollTop = previousScroll;
  }
  function cartAnchor(index, size = state.cart[index].size) {
    const row = state.cart[index];
    return {key:rowKey(row,size),top:$(`[data-cart-key="${rowKey(row)}"]`).getBoundingClientRect().top};
  }
  function openWhatsApp(message) {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank','noopener,noreferrer');
  }
  function checkout() {
    if (!state.cart.length) return;
    const lines = state.cart.map(row => {
      const p = byId.get(row.id);
      return `${row.quantity} × ${p.name} (${p.modelCode || row.id})\n${p.category==='Cinta' ? 'Medida' : 'Talla'}: ${row.size} · Color: ${row.color}\n${hasPrice(p) ? `Precio referencial: ${money(p.price)} / unidad` : 'Precio por confirmar'}`;
    });
    openWhatsApp(`Hola CORRY SPORT, quisiera consultar este pedido:\n\n${lines.join('\n\n')}\n\nTotal referencial: ${totalText()}\n¿Me confirman precio actual, tallas, disponibilidad y forma de entrega?`);
  }

  function closeMenu(restoreFocus=false) {
    $('#navLinks').classList.remove('open');
    $('#menuBtn').setAttribute('aria-expanded','false');
    $('#menuBtn').setAttribute('aria-label','Abrir menú');
    if (restoreFocus) $('#menuBtn').focus();
  }
  document.addEventListener('click', event => {
    const galleryStep = event.target.closest('[data-gallery-step]');
    if (galleryStep) setGallery(activeGallery.index+Number(galleryStep.dataset.galleryStep));
    const galleryIndex = event.target.closest('[data-gallery-index]');
    if (galleryIndex) setGallery(Number(galleryIndex.dataset.galleryIndex));
    const application = event.target.closest('[data-application]');
    if (application) setApplication(Number(application.dataset.application));
    const sizeInput = event.target.closest('#detailForm input[type="radio"][name="size"]');
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
    if (category) { state.category = category.dataset.category; state.limit=initialLimit; renderProducts(); }
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
      const p = byId.get(event.target.dataset.id), color = event.target.dataset.selectedColor;
      if (p?.sizes.includes(size) && variants(p).some(v=>v.color===color)) addItem(p.id,size,color);
    }
  });
  let dragStart = null;
  $('#productDetail').addEventListener('pointerdown',event => {
    const stage = event.target.closest('#galleryStage');
    if (!stage || event.target.closest('button') || event.button !== 0 || variants(byId.get(activeGallery.id)).length < 2) return;
    dragStart = {x:event.clientX,y:event.clientY,pointer:event.pointerId};
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });
  $('#productDetail').addEventListener('pointerup',event => {
    const stage = event.target.closest('#galleryStage');
    if (!dragStart || dragStart.pointer !== event.pointerId || !stage) return;
    const dx = event.clientX-dragStart.x, dy = event.clientY-dragStart.y;
    dragStart = null; stage.classList.remove('is-dragging');
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) setGallery(activeGallery.index+(dx<0 ? 1 : -1));
  });
  $('#productDetail').addEventListener('pointercancel',()=>{dragStart=null;$('#galleryStage')?.classList.remove('is-dragging');});
  $('#productDetail').addEventListener('keydown',event=>{
    if (event.target.id === 'galleryStage' && ['ArrowLeft','ArrowRight'].includes(event.key) && variants(byId.get(activeGallery.id)).length > 1) {
      event.preventDefault();setGallery(activeGallery.index+(event.key==='ArrowRight' ? 1 : -1));
    }
  });
  $('#productDialog').addEventListener('close',()=>{
    dragStart=null;$('#productDialog video')?.pause();
  });
  $('#cartItems').addEventListener('change', event => {
    if (!event.target.matches('[data-cart-size]')) return;
    const index = Number(event.target.dataset.cartSize), size = event.target.value, row = state.cart[index];
    const anchor = cartAnchor(index,size);
    const duplicate = state.cart.find((other,i) => i !== index && other.id === row.id && other.size === size && other.color === row.color);
    if (duplicate && duplicate.quantity+row.quantity > 99) {
      event.target.value = row.size; notify('La talla seleccionada superaría 99 unidades. Ajusta primero la cantidad.'); return;
    }
    row.size = size;
    if (duplicate) { row.quantity += duplicate.quantity; state.cart.splice(state.cart.indexOf(duplicate),1); }
    saveCart(); renderCart(anchor);
    const newIndex = state.cart.findIndex(item => item.id === row.id && item.size === size && item.color === row.color);
    $(`[data-cart-size="${newIndex}"]`).focus({preventScroll:true});
  });
  $('#searchInput').addEventListener('input', event => {state.search=event.target.value;state.limit=initialLimit;renderProducts();});
  $('#sortSelect').addEventListener('change', event => {state.sort=event.target.value;state.limit=initialLimit;renderProducts();});
  $('#resetFilters').addEventListener('click', () => {state.category='Todos';state.search='';state.limit=initialLimit;$('#searchInput').value='';renderProducts();$('#searchInput').focus();});
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
