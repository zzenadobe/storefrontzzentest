/* eslint-disable import/no-unresolved */

// Drop-in Tools
import { events } from '@dropins/tools/event-bus.js';

// Cart dropin
import { publishShoppingCartViewEvent } from '@dropins/storefront-cart/api.js';

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';
import { rootLink } from '../../scripts/scripts.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, true);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.classList.remove('active');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = '<h5 class="back-link">All Categories</h5><hr />';

/**
 * Sets up the submenu
 * @param {navSection} navSection The nav section element
 */
function setupSubmenu(navSection) {
  if (navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const submenu = navSection.querySelector('ul');
    const wrapper = document.createElement('div');
    const header = subMenuHeader.cloneNode(true);
    const title = document.createElement('h6');
    title.classList.add('submenu-title');
    title.textContent = label.textContent;

    wrapper.classList.add('submenu-wrapper');
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    wrapper.appendChild(submenu.cloneNode(true));

    navSection.appendChild(wrapper);
    navSection.removeChild(submenu);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          toggleAllNavSections(navSections);
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              overlay.classList.remove('show');
              return;
            }
            navSection.setAttribute('aria-expanded', 'true');
            overlay.classList.add('show');
          }
        });
      });
  }

  const navTools = nav.querySelector('.nav-tools');

  /** Mini Cart */
  const excludeMiniCartFromPaths = ['/checkout'];

  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="Cart"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');

  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  // load nav as fragment
  const miniCartMeta = getMetadata('mini-cart');
  const miniCartPath = miniCartMeta ? new URL(miniCartMeta, window.location).pathname : '/mini-cart';
  loadFragment(miniCartPath).then((miniCartFragment) => {
    minicartPanel.append(miniCartFragment.firstElementChild);
  });

  async function toggleMiniCart(state) {
    const show = state ?? !minicartPanel.classList.contains('nav-tools-panel--show');
    const stateChanged = show !== minicartPanel.classList.contains('nav-tools-panel--show');
    minicartPanel.classList.toggle('nav-tools-panel--show', show);

    if (stateChanged && show) {
      publishShoppingCartViewEvent();
    }
  }

  cartButton.addEventListener('click', () => toggleMiniCart());

  // Cart Item Counter
  events.on(
    'cart/data',
    (data) => {
      if (data?.totalQuantity) {
        cartButton.setAttribute('data-count', data.totalQuantity);
      } else {
        cartButton.removeAttribute('data-count');
      }
    },
    { eager: true },
  );

  /** Search */
  // TODO
  const search = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">Search</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form action="/search" method="GET">
        <input id="search" type="search" name="q" placeholder="Search" />
        <div id="search_autocomplete" class="search-autocomplete"></div>
      </form>
    </div>
  </div>
  `);

  navTools.append(search);

  const searchPanel = navTools.querySelector('.nav-search-panel');

  const searchButton = navTools.querySelector('.nav-search-button');

  const searchInput = searchPanel.querySelector('input');

  const searchForm = searchPanel.querySelector('form');

  searchForm.action = rootLink('/search');

  async function toggleSearch(state) {
    const show = state ?? !searchPanel.classList.contains('nav-tools-panel--show');

    searchPanel.classList.toggle('nav-tools-panel--show', show);

    if (show) {
      await import('./searchbar.js');
      searchInput.focus();
    }
  }

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
    toggleSearch();
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    if (!minicartPanel.contains(e.target) && !cartButton.contains(e.target)) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  navWrapper.addEventListener('mouseout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    toggleMenu(nav, navSections, false);
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);
}
