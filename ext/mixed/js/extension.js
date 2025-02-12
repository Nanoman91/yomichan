/*
 * Copyright (C) 2019  Alex Yatskov <alex@foosoft.net>
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


// toIterable is required on Edge for cross-window origin objects.
function toIterable(value) {
    if (typeof Symbol !== 'undefined' && typeof value[Symbol.iterator] !== 'undefined') {
        return value;
    }

    if (value !== null && typeof value === 'object') {
        const length = value.length;
        if (typeof length === 'number' && Number.isFinite(length)) {
            const array = [];
            for (let i = 0; i < length; ++i) {
                array.push(value[i]);
            }
            return array;
        }
    }

    throw new Error('Could not convert to iterable');
}

function extensionHasChrome() {
    try {
        return typeof chrome === 'object' && chrome !== null;
    } catch (e) {
        return false;
    }
}

function extensionHasBrowser() {
    try {
        return typeof browser === 'object' && browser !== null;
    } catch (e) {
        return false;
    }
}

function errorToJson(error) {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack
    };
}

function jsonToError(jsonError) {
    const error = new Error(jsonError.message);
    error.name = jsonError.name;
    error.stack = jsonError.stack;
    return error;
}

function logError(error, alert) {
    const manifest = chrome.runtime.getManifest();
    let errorMessage = `${manifest.name} v${manifest.version} has encountered an error.\n`;
    errorMessage += `Originating URL: ${window.location.href}\n`;

    const errorString = `${error.toString ? error.toString() : error}`;
    const stack = `${error.stack}`.trimRight();
    errorMessage += (!stack.startsWith(errorString) ? `${errorString}\n${stack}` : `${stack}`);

    errorMessage += '\n\nIssues can be reported at https://github.com/FooSoft/yomichan/issues';

    console.error(errorMessage);

    if (alert) {
        window.alert(`${errorString}\n\nCheck the developer console for more details.`);
    }
}

const EXTENSION_IS_BROWSER_EDGE = (
    extensionHasBrowser() &&
    (!extensionHasChrome() || (typeof chrome.runtime === 'undefined' && typeof browser.runtime !== 'undefined'))
);

if (EXTENSION_IS_BROWSER_EDGE) {
    // Edge does not have chrome defined.
    chrome = browser;
}

function promiseTimeout(delay, resolveValue) {
    if (delay <= 0) {
        return Promise.resolve(resolveValue);
    }

    let timer = null;
    let promiseResolve = null;
    let promiseReject = null;

    const complete = (callback, value) => {
        if (callback === null) { return; }
        if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
        }
        promiseResolve = null;
        promiseReject = null;
        callback(value);
    };

    const resolve = (value) => complete(promiseResolve, value);
    const reject = (value) => complete(promiseReject, value);

    const promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject = reject;
    });
    timer = window.setTimeout(() => {
        timer = null;
        resolve(resolveValue);
    }, delay);

    promise.resolve = resolve;
    promise.reject = reject;

    return promise;
}
