// ==UserScript==
// @name         Produktlink-Kopierer Multi-Domain (Digitec/Galaxus)
// @version      3.2
// @description  Buttons zum Kopieren von Produktlinks mit optionalem Titel (Rich-Link) für Digitec & Galaxus – stabil für Produktseiten (verfügbar & nicht verfügbar). Vergleichsseiten separat umsetzbar.
// @author       Nikku
// @match        https://www.digitec.ch/*
// @match        https://www.galaxus.ch/*
// @match        https://www.galaxus.de/*
// @match        https://www.galaxus.at/*
// @match        https://www.galaxus.fr/*
// @match        https://www.galaxus.it/*
// @match        https://www.galaxus.be/*
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://github.com/CallmeNikku/produktlink-kopierer/raw/refs/heads/main/Produktlink-Kopierer%20Multi-Domain%20(Digitec-Galaxus)-3.1.user.js
// @downloadURL  https://github.com/CallmeNikku/produktlink-kopierer/raw/refs/heads/main/Produktlink-Kopierer%20Multi-Domain%20(Digitec-Galaxus)-3.1.user.js
// ==/UserScript==

(function () {
    'use strict';

    const isDigitec = window.location.hostname.includes('digitec');
    const buttonColor = isDigitec ? '#1578CF' : '#b066d9';

    const targets = [
        { label: 'DG', domain: 'www.digitec.ch', path: '/de/s1/' },
        { label: 'CH', domain: 'www.galaxus.ch', path: '/de/s8/' },
        { label: 'DE', domain: 'www.galaxus.de', path: '/de/s8/' },
        { label: 'AT', domain: 'www.galaxus.at', path: '/de/s8/' },
        { label: 'FR', domain: 'www.galaxus.fr', path: '/fr/s8/' },
        { label: 'IT', domain: 'www.galaxus.it', path: '/it/s8/' },
        { label: 'BE', domain: 'www.galaxus.be', path: '/fr/s8/' }
    ];

    function createButtons(container, urlBuilder) {
        const checkboxWrapper = document.createElement('label');
        checkboxWrapper.style.display = 'flex';
        checkboxWrapper.style.alignItems = 'center';
        checkboxWrapper.style.gap = '6px';
        checkboxWrapper.style.fontSize = '12px';
        checkboxWrapper.style.color = '#555';
        checkboxWrapper.style.marginBottom = '5px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'copy-with-title';

        const checkboxLabel = document.createElement('span');
        checkboxLabel.textContent = 'Titel mitkopieren (Rich-Link)';

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(checkboxLabel);
        container.appendChild(checkboxWrapper);

        const buttonWrapper = document.createElement('div');
        buttonWrapper.style.display = 'flex';
        buttonWrapper.style.gap = '6px';
        buttonWrapper.style.flexWrap = 'wrap';

        targets.forEach(target => {
            const btn = document.createElement('button');
            btn.textContent = target.label;
            btn.style.padding = '6px 10px';
            btn.style.fontSize = '12px';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = buttonColor;
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '6px';

            btn.onclick = () => {
                const url = urlBuilder(target);
                const title = document.title;

                if (checkbox.checked) {
                    const markdown = `[${title}](${url})`;
                    const html = `<a href="${url}">${title}</a>`;
                    const listener = (e) => {
                        e.clipboardData.setData('text/plain', markdown);
                        e.clipboardData.setData('text/html', html);
                        e.preventDefault();
                    };
                    document.addEventListener('copy', listener, { once: true });
                    document.execCommand('copy');
                } else {
                    GM_setClipboard(url, 'text');
                }

                btn.textContent = `✅ ${target.label}`;
                setTimeout(() => (btn.textContent = target.label), 2000);
            };

            buttonWrapper.appendChild(btn);
        });

        container.appendChild(buttonWrapper);
    }

    function addToProductPage() {
        const productSegment = (window.location.pathname + window.location.search).match(/\/s\d+\/product\/([^?#]+)/)?.[1];
        if (!productSegment || document.getElementById('copy-link-bar')) return;

        const cartBtn = document.querySelector('#addToCartButton');
        const unavailableNode = document.evaluate("//*[contains(text(), 'Aktuell nicht lieferbar')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        const insertPoint = cartBtn || unavailableNode;
        if (!insertPoint || !insertPoint.parentElement) return;

        const container = document.createElement('div');
        container.id = 'copy-link-bar';
        container.style.marginBottom = '12px';

        createButtons(container, (target) => `https://${target.domain}${target.path}product/${productSegment}`);
        insertPoint.parentElement.insertBefore(container, insertPoint);
    }

    const init = () => {
        if (window.location.pathname.includes('/product/')) {
            addToProductPage();
        }
        if (window.location.pathname.includes('/comparison/')) {
            const titleNode = document.querySelector('h1[class^="sc-"], h1[class^="ycNaCii"]');
            if (!titleNode || document.getElementById('copy-link-bar')) return;

            const container = document.createElement('div');
            container.id = 'copy-link-bar';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';
            container.style.marginTop = '10px';
            container.style.marginLeft = '10px';

            createButtons(container, (target) => `https://${target.domain}${window.location.pathname}`);
            titleNode.parentElement?.appendChild(container);
        }
    };

    window.addEventListener('load', () => setTimeout(init, 500));
    const observer = new MutationObserver(init);
    observer.observe(document.body, { childList: true, subtree: true });
})();

// Vergleichslisten-Teil (Produkttitel sauber aus aria-label)
(function() {
  'use strict';
  if (!window.location.pathname.includes('/comparison/')) return;

  const isDigitec = window.location.hostname.includes('digitec');
  const buttonColor = isDigitec ? '#1578CF' : '#b066d9';

  const addButton = () => {
    if (document.getElementById('copy-all-links')) return;

    const header = document.querySelector('h1[class^="sc-"], h1[class^="ycNaCii"]');
    if (!header || !header.parentElement) return;

    const wrapper = header.parentElement;
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.zIndex = '1000';

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.marginLeft = '20px';
    container.style.position = 'relative';
    container.style.top = '18px';

    const btn = document.createElement('button');
    btn.id = 'copy-all-links';
    btn.textContent = '📋 Alle Produktlinks';
    btn.style.fontSize = '14px';
    btn.style.padding = '8px 12px';
    btn.style.background = buttonColor;
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'copy-richlink';
    checkbox.style.marginLeft = '10px';

    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.fontSize = '12px';
    label.style.color = '#888';
    label.style.marginLeft = '10px';
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' Titel als Rich-Link'));

    btn.onclick = (e) => {
      e.stopPropagation();
      const cards = Array.from(document.querySelectorAll('a[href*="/product/"]'));
      const unique = [];
      cards.forEach(link => {
        const url = link.href.split('?')[0];
        let title = link.getAttribute('aria-label') || link.innerText.trim();
        if (!title) title = 'Produkt';
        if (url && !url.includes('/explore/') && !unique.find(p => p.url === url)) {
          unique.push({ url, title });
        }
      });

      if (unique.length === 0) return;

      let output;
      if (checkbox.checked) {
        output = unique.map(p => `- [${p.title}](${p.url})`).join('\n');
      } else {
        output = unique.map(p => `- ${p.url}`).join('\n');
      }

      navigator.clipboard.writeText(output);
      btn.textContent = '✅ Kopiert!';
      setTimeout(() => btn.textContent = '📋 Alle Produktlinks', 2000);
    };

    container.appendChild(btn);
    container.appendChild(label);
    wrapper.appendChild(container);
  };

  const observer = new MutationObserver(addButton);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', addButton);
})();

