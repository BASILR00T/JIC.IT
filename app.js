/**
 * Courses Practical Hub - Core Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    await initNavbar();
    const mainContent = document.getElementById('main-content');
    const searchInput = document.getElementById('search-input');

    if (mainContent) {
        initHub();
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
});

async function initHub() {
    try {
        // Fetch modules and lessons together
        const [modulesResp, lessonsResp] = await Promise.all([
            supabaseClient.from('modules').select('*').order('block', { ascending: true }),
            supabaseClient.from('lessons').select('*').order('id', { ascending: true })
        ]);

        if (modulesResp.error) throw modulesResp.error;
        if (lessonsResp.error) throw lessonsResp.error;

        const modules = modulesResp.data;
        const lessons = lessonsResp.data;

        renderHub(modules, lessons);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function renderHub(modules, lessons) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    const blocks = [2, 3];

    blocks.forEach(blockNum => {
        const blockModules = modules.filter(m => m.block === blockNum);
        if (blockModules.length === 0) return;

        const section = document.createElement('section');
        section.className = 'hub-section';

        const h2 = document.createElement('h2');
        h2.className = 'block-title';
        h2.innerText = `Block ${blockNum}`;
        section.appendChild(h2);

        const grid = document.createElement('div');
        grid.className = 'modules-grid';

        blockModules.forEach(module => {
            const moduleLessons = lessons.filter(l => l.module_id === module.id);
            const card = createModuleCard(module, moduleLessons);
            grid.appendChild(card);
        });

        section.appendChild(grid);
        mainContent.appendChild(section);
    });
}

function createModuleCard(module, lessons = []) {
    const card = document.createElement('div');
    card.className = `module-card ${module.disabled ? 'disabled' : ''}`;

    let lessonLinks = '';
    if (lessons.length > 0) {
        lessonLinks = `
            <div class="lesson-links-quick" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; width: 100%;">
                ${lessons.map(l => `
                    <a href="lesson.html?slug=${l.slug}" class="lesson-quick-link" 
                       style="display: block; font-size: 0.85rem; color: var(--primary-brand); text-decoration: none; margin-bottom: 0.5rem;">
                       • ${l.title}
                    </a>
                `).join('')}
            </div>
        `;
    }

    card.innerHTML = `
        <div class="card-icon" style="font-size: 2rem; margin-bottom: 1rem;">${module.icon}</div>
        <h2 style="margin-bottom: 0.5rem;">${module.title}</h2>
        <p style="font-size: 0.9rem; color: var(--text-secondary);">${module.description}</p>
        ${lessonLinks}
    `;

    return card;
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.module-card');

    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        if (text.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }

        // Hide entire section if no cards visible
        const section = card.closest('.hub-section');
        if (section) {
            const visibleCards = section.querySelectorAll('.module-card[style="display: flex;"]');
            section.style.display = visibleCards.length === 0 && term !== '' ? 'none' : 'block';
        }
    });
}

async function initNavbar() {
    const parent = document.querySelector('body');
    const currentPage = window.location.pathname.toLowerCase();

    // DO NOT inject global navbar on Admin or Login pages
    if (currentPage.includes('admin') || currentPage.includes('login')) return;

    const nav = document.createElement('nav');
    nav.className = 'navbar';

    const { data: { user } } = await supabaseClient.auth.getUser();

    const adminLink = user
        ? `<a href="admin.html" class="nav-item ${currentPage === 'admin.html' ? 'active' : ''}">Admin Control</a>`
        : `<a href="login.html" class="nav-item ${currentPage === 'login.html' ? 'active' : ''}">Login</a>`;

    const logoutBtn = user
        ? `<a href="#" onclick="handleLogout()" class="nav-item" style="color: #ef4444;">Logout</a>`
        : '';

    nav.innerHTML = `
        <div class="container">
            <a href="index.html" class="nav-logo">
                <span style="color: var(--primary-brand);">CP</span> Hub
            </a>
            <div class="nav-links">
                <a href="index.html" class="nav-item ${currentPage === 'index.html' ? 'active' : ''}">Home</a>
                <a href="hub.html" class="nav-item ${currentPage === 'hub.html' ? 'active' : ''}">Library</a>
                ${adminLink}
                ${logoutBtn}
            </div>
        </div>
    `;

    parent.prepend(nav);
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}
