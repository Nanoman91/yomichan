/*
 * Copyright (C) 2017  Alex Yatskov <alex@foosoft.net>
 * Author: Alex Yatskov <alex@foosoft.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


function showExtensionInfo() {
    const node = document.getElementById('extension-info');
    if (node === null) { return; }

    const manifest = chrome.runtime.getManifest();
    node.textContent = `${manifest.name} v${manifest.version}`;
}

function setupButtonEvents(selector, command, url) {
    const node = $(selector);
    node.on('click', (e) => {
        if (e.button !== 0) { return; }
        apiCommandExec(command, {newTab: e.ctrlKey});
        e.preventDefault();
    })
    .on('auxclick', (e) => {
        if (e.button !== 1) { return; }
        apiCommandExec(command, {newTab: true});
        e.preventDefault();
    });

    if (typeof url === 'string') {
        node.attr('href', url);
        node.attr('target', '_blank');
        node.attr('rel', 'noopener');
    }
}

$(document).ready(utilAsync(() => {
    showExtensionInfo();

    apiGetEnvironmentInfo().then(({browser}) => {
        // Firefox mobile opens this page as a full webpage.
        document.documentElement.dataset.mode = (browser === 'firefox-mobile' ? 'full' : 'mini');
    });

    const manifest = chrome.runtime.getManifest();

    setupButtonEvents('.action-open-search', 'search', chrome.runtime.getURL('/bg/search.html'));
    setupButtonEvents('.action-open-options', 'options', chrome.runtime.getURL(manifest.options_ui.page));
    setupButtonEvents('.action-open-help', 'help');

    const optionsContext = {
        depth: 0,
        url: window.location.href
    };
    apiOptionsGet(optionsContext).then(options => {
        const toggle = $('#enable-search');
        toggle.prop('checked', options.general.enable).change();
        toggle.bootstrapToggle();
        toggle.change(() => apiCommandExec('toggle'));

        const toggle2 = $('#enable-search2');
        toggle2.prop('checked', options.general.enable).change();
        toggle2.change(() => apiCommandExec('toggle'));
    });
}));
