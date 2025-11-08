// assets/admin.js — FULLY EDITABLE CMS
const ADMIN_PASSWORD = 'admin123';
let isAdmin = false;
let isEditMode = false;
let messages = [];

// === ADMIN STATE (SESSION-ONLY) ===
if (sessionStorage.getItem('lakshya_admin') === 'true') {
    isAdmin = true;
    document.body.classList.add('admin-mode');
}

// === LOGIN ===
function enterAdmin() {
    const pass = prompt('Enter Admin Password:');
    if (pass === ADMIN_PASSWORD) {
        isAdmin = true;
        sessionStorage.setItem('lakshya_admin', 'true');
        document.body.classList.add('admin-mode');
        createAdminButtons();
        alert('Admin Mode ON');
        loadEdits();
    } else {
        alert('Wrong password!');
    }
}

// === LOGOUT ===
function exitAdmin() {
    sessionStorage.removeItem('lakshya_admin');
    isAdmin = false;
    isEditMode = false;
    document.body.classList.remove('admin-mode', 'edit-mode');
    removeAdminButtons();
    location.reload();
}

// === CREATE BUTTONS ===
function createAdminButtons() {
    const footer = document.querySelector('footer .container');
    if (!footer) return;

    // Remove old
    document.querySelectorAll('#admin-link, #edit-page-btn, #logout-btn').forEach(el => el.remove());

    const copyright = footer.querySelector('.copyright');

    const adminLink = document.createElement('a');
    adminLink.id = 'admin-link';
    adminLink.href = '#';
    adminLink.innerHTML = 'Admin';
    adminLink.style = 'margin-left:15px;font-size:0.8rem;color:var(--accent);text-decoration:underline;';
    adminLink.onclick = (e) => { e.preventDefault(); enterAdmin(); };

    const editBtn = document.createElement('span');
    editBtn.id = 'edit-page-btn';
    editBtn.innerHTML = 'Edit Page';
    editBtn.style = 'margin-left:15px;font-size:0.8rem;color:#fbbf24;cursor:pointer;text-decoration:underline;';
    editBtn.onclick = toggleEdit;

    const logoutBtn = document.createElement('span');
    logoutBtn.id = 'logout-btn';
    logoutBtn.innerHTML = 'Logout';
    logoutBtn.style = 'margin-left:15px;font-size:0.8rem;color:#ff6b6b;cursor:pointer;text-decoration:underline;';
    logoutBtn.onclick = exitAdmin;

    copyright.appendChild(adminLink);
    if (isAdmin) {
        copyright.appendChild(editBtn);
        copyright.appendChild(logoutBtn);
    }
}

function removeAdminButtons() {
    document.querySelectorAll('#edit-page-btn, #logout-btn').forEach(el => el.remove());
}

// === TOGGLE EDIT MODE ===
function toggleEdit() {
    isEditMode = !isEditMode;
    document.body.classList.toggle('edit-mode', isEditMode);
    if (isEditMode) enableAllEditing();
    else disableAllEditing();
}

// === ENABLE EDITING (TEXT + IMAGES + ANY ELEMENT) ===
function enableAllEditing() {
    // TEXT
    document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,li,div,section,header,footer,nav').forEach(el => {
        if (!el.dataset.editKey && el.contentEditable !== 'true') {
            el.contentEditable = true;
            el.style.outline = '2px dashed #00e5ff';
            el.style.borderRadius = '4px';
            el.style.padding = '2px';
            el.style.minHeight = '1.2em';
            el.addEventListener('blur', saveTextEdit);
        }
    });

    // IMAGES
    document.querySelectorAll('img').forEach(img => {
        if (!img.dataset.imgKey) {
            img.style.cursor = 'pointer';
            img.title = 'Click to change image';
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!isEditMode) return;
                const url = prompt('New image URL:', img.src);
                if (url && url.trim()) {
                    img.src = url.trim();
                    saveImageEdit(img);
                }
            });
        }
    });

    // BACKGROUND IMAGES (via style)
    document.querySelectorAll('*').forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none' && !el.dataset.bgKey) {
            el.style.cursor = 'pointer';
            el.title = 'Click to change background';
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!isEditMode) return;
                const url = prompt('New background URL:', bg.match(/url\(["']?([^"']+)["']?\)/)?.[1] || '');
                if (url) {
                    el.style.backgroundImage = `url(${url.trim()})`;
                    saveBgEdit(el, url.trim());
                }
            });
        }
    });
}

function disableAllEditing() {
    document.querySelectorAll('[contentEditable="true"]').forEach(el => {
        el.contentEditable = false;
        el.style.outline = '';
        el.style.borderRadius = '';
        el.style.padding = '';
        el.style.minHeight = '';
    });
    document.querySelectorAll('img, *').forEach(el => {
        el.style.cursor = '';
        el.title = '';
    });
}

// === SAVE TEXT ===
function saveTextEdit() {
    const key = this.dataset.editKey || `text_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.dataset.editKey = key;
    const data = JSON.parse(localStorage.getItem('lakshya_text')) || {};
    data[key] = this.innerHTML;
    localStorage.setItem('lakshya_text', JSON.stringify(data));
}

// === SAVE IMAGE ===
function saveImageEdit(img) {
    const key = img.dataset.imgKey || `img_${Date.now()}`;
    img.dataset.imgKey = key;
    const data = JSON.parse(localStorage.getItem('lakshya_images')) || {};
    data[key] = img.src;
    localStorage.setItem('lakshya_images', JSON.stringify(data));
}

// === SAVE BACKGROUND ===
function saveBgEdit(el, url) {
    const key = el.dataset.bgKey || `bg_${Date.now()}`;
    el.dataset.bgKey = key;
    const data = JSON.parse(localStorage.getItem('lakshya_bg')) || {};
    data[key] = { selector: getSelector(el), url };
    localStorage.setItem('lakshya_bg', JSON.stringify(data));
}

function getSelector(el) {
    if (el.id) return `#${el.id}`;
    if (el.className) return `.${el.className.split(' ').join('.')}`;
    return el.tagName.toLowerCase();
}

// === LOAD ALL EDITS ===
function loadEdits() {
    // Text
    const text = JSON.parse(localStorage.getItem('lakshya_text')) || {};
    Object.keys(text).forEach(k => {
        const el = document.querySelector(`[data-edit-key="${k}"]`);
        if (el) el.innerHTML = text[k];
    });

    // Images
    const imgs = JSON.parse(localStorage.getItem('lakshya_images')) || {};
    Object.keys(imgs).forEach(k => {
        const img = document.querySelector(`[data-img-key="${k}"]`);
        if (img) img.src = imgs[k];
    });

    // Backgrounds
    const bgs = JSON.parse(localStorage.getItem('lakshya_bg')) || {};
    Object.keys(bgs).forEach(k => {
        const item = bgs[k];
        const el = document.querySelector(item.selector);
        if (el) el.style.backgroundImage = `url(${item.url})`;
    });
}

// === CONTACT ADMIN ===
if (window.location.pathname.includes('contact.html') && isAdmin) {
    document.addEventListener('DOMContentLoaded', initContactAdmin);
}

function initContactAdmin() {
    const container = document.querySelector('.section');
    if (!container || document.querySelector('.admin-contact-tabs')) return;

    const tabs = document.createElement('div');
    tabs.className = 'admin-contact-tabs';
    tabs.innerHTML = `
        <button onclick="showInbox()" class="tab-active" id="tab-inbox">Inbox (${messages.length})</button>
        <button onclick="showCompose()" id="tab-compose">Compose</button>
    `;
    container.insertBefore(tabs, container.firstChild);

    const content = document.createElement('div');
    content.id = 'admin-contact-content';
    container.insertBefore(content, tabs.nextSibling);

    showInbox();
}

window.showInbox = function() { /* same as before */ };
window.showCompose = function() { /* same as before */ };
function renderInbox() { /* same */ }
function renderCompose() { /* same */ }
window.replyMessage = function(i) { /* same */ }
window.sendReply = () => alert('Copy & send.');
window.exportMessages = function() { /* same */ }

// === FORM SUBMIT ===
if (window.location.pathname.includes('contact.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', e => {
                e.preventDefault();
                const data = {
                    name: form.name.value,
                    email: form.email.value,
                    company: form.company.value || '—',
                    message: form.message.value,
                    time: new Date().toLocaleString(),
                    replied: false
                };
                messages.push(data);
                localStorage.setItem('lakshya_messages', JSON.stringify(messages));
                alert('Sent!');
                form.reset();
                if (isAdmin) showInbox();
            });
        }
    });
}

// === LOAD MESSAGES ===
messages = JSON.parse(localStorage.getItem('lakshya_messages')) || [];

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', () => {
    createAdminButtons();
    if (window.location.pathname.includes('contact.html') && isAdmin) {
        setTimeout(initContactAdmin, 100);
    }
});