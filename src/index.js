import domReady from '@wordpress/dom-ready';

// Import styles
import './style.scss';

let currentPage = null;
let portalData = {};
let isMobileMenuOpen = false;
let notifications = [];
let isDarkMode = false;

// Initialize the dashboard when DOM is ready
domReady(() => {
    console.log('Site Dashboard: Initializing portal...');
    
    const rootElement = document.getElementById('site-dashboard-root');
    if (rootElement) {
        initializePortal(rootElement);
    } else {
        console.error('Site Dashboard: Root element not found.');
    }
});

async function initializePortal(rootElement) {
    // Show loading state
    rootElement.innerHTML = createLoadingHTML();
    
    try {
        // Fetch portal data from API
        const response = await fetch(`${window.siteDashboardData?.apiUrl}portal-data`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': window.siteDashboardData?.nonce
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load portal data: ${response.status}`);
        }
        
        portalData = await response.json();
        
        // Render portal layout
        rootElement.innerHTML = createPortalHTML();
        
        // Add event listeners
        addEventListeners();
        
        // Load first page if available
        if (portalData.menu_items && portalData.menu_items.length > 0) {
            loadPageContent(portalData.menu_items[0].page_id);
        }
        
    } catch (error) {
        console.error('Portal error:', error);
        rootElement.innerHTML = createErrorHTML(error.message);
    }
}

function createPortalHTML() {
    const settings = portalData.settings || {};
    
    return `
        <div id="wrapper" class="portal-wrapper ${isDarkMode ? 'dark-theme' : ''}">
            ${createSidebarHTML()}
            ${createHeaderHTML()}
            ${createMainContentHTML()}
        </div>
    `;
}

function createSidebarHTML() {
    const settings = portalData.settings || {};
    const currentUser = window.siteDashboardData?.currentUser || {};
    
    return `
        <aside id="sidebar" class="sidebar-wrapper">
            <!-- User Brand Section -->
            <div class="sidebar-brand user">
                <a href="#" id="user-brand">
                    <i class="user__img">${currentUser.avatar || currentUser.name?.[0] || 'U'}</i>
                </a>
                <div class="user__text">
                    <span class="user__title">${currentUser.name || 'User'}</span>
                    <span class="user__subtitle">${currentUser.role || 'Member'}</span>
                </div>
            </div>

            <!-- Portal Title -->
            <div class="sidebar-brand sidebar-heading">
                ${settings.portal_title || 'Portal Dashboard'}
            </div>

            <!-- Navigation Menu -->
            <ul class="sidebar-nav">
                ${createNavigationHTML()}
            </ul>

            <!-- Widgets Section -->
            ${createWidgetsHTML()}

            <!-- User Profile Section -->
            ${createUserProfileHTML()}
        </aside>
    `;
}

function createNavigationHTML() {
    if (!portalData.menu_items || portalData.menu_items.length === 0) {
        return `
            <li class="no-menu-items">
                <span>No pages assigned</span>
            </li>
        `;
    }
    
    return portalData.menu_items
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((item, index) => {
            const hasSubmenu = item.children && item.children.length > 0;
            return `
                <li ${hasSubmenu ? 'class="has-submenu"' : ''}>
                    <a href="#" data-page-id="${item.page_id}" class="portal-menu-link">
                        <i class="menu-icon menu-icon_${index + 1}">
                            ${item.icon ? createIconSVG(item.icon) : createDefaultIconSVG()}
                        </i>
                        <span>${item.title}</span>
                        ${hasSubmenu ? '<i class="up up_2">' + createChevronSVG() + '</i>' : ''}
                    </a>
                    ${hasSubmenu ? createSubmenuHTML(item.children) : ''}
                </li>
            `;
        }).join('');
}

function createSubmenuHTML(children) {
    return `
        <ul class="sidebar-submenu">
            ${children.map(child => `
                <li><a href="#" data-page-id="${child.page_id}">${child.title}</a></li>
            `).join('')}
        </ul>
    `;
}

function createWidgetsHTML() {
    if (!portalData.widgets || portalData.widgets.length === 0) {
        return '';
    }
    
    return portalData.widgets.map(widget => {
        switch (widget.type) {
            case 'progress':
                return createProgressWidgetHTML(widget);
            case 'stats':
                return createStatsWidgetHTML(widget);
            default:
                return createCustomWidgetHTML(widget);
        }
    }).join('');
}

function createProgressWidgetHTML(widget) {
    return `
        <div class="sidebar-progress">
            <div class="sidebar-progress_title">${widget.title}</div>
            <div class="sidebar-progress_subtitle">${widget.subtitle}</div>
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${widget.percentage || 35}%" 
                     aria-valuenow="${widget.percentage || 35}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            ${widget.button_text ? `
                <div class="sidebar-progress_button">
                    <a href="${widget.button_link || '#'}">${widget.button_text}</a>
                </div>
            ` : ''}
        </div>
    `;
}

function createStatsWidgetHTML(widget) {
    return `
        <div class="sidebar-stats">
            <h3>${widget.title}</h3>
            <div class="stats-content">
                ${widget.content || ''}
            </div>
        </div>
    `;
}

function createCustomWidgetHTML(widget) {
    return `
        <div class="sidebar-widget sidebar-widget-${widget.type}">
            <h3>${widget.title}</h3>
            <div class="widget-content">
                ${widget.content || ''}
            </div>
        </div>
    `;
}

function createUserProfileHTML() {
    const currentUser = window.siteDashboardData?.currentUser || {};
    
    return `
        <hr class="line" />
        <nav class="userProfile">
            <ul>
                <li class="userAvatar">
                    <div class="userAvatar-image">
                        <a href="#" data-toggle="modal" data-target="#userProfile">
                            ${currentUser.avatar ? `<img src="${currentUser.avatar}" alt="User avatar" />` : 
                              `<div class="avatar-placeholder">${currentUser.name?.[0] || 'U'}</div>`}
                        </a>
                    </div>
                    <div class="userInfo">
                        <div class="userTitle">${currentUser.name || 'User'}</div>
                    </div>
                    <a href="#" class="user-menu-toggle">
                        <span>${createTripleDotsIconSVG()}</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;
}

function createHeaderHTML() {
    return `
        <div id="navbar-wrapper">
            <div class="header">
                <!-- Search -->
                <form class="search">
                    <button type="submit" class="search__button">
                        <i class="search__icon">${createSearchIconSVG()}</i>
                    </button>
                    <input type="text" class="search__field" id="search-field" 
                           placeholder="Search for data, users..." />
                    <div class="search-tooltip" id="search-tooltip" style="display: none;">
                        <div class="search-tooltip__header">Search results</div>
                        <div id="search-results"></div>
                    </div>
                </form>

                <!-- Header Items -->
                <div class="header-item-group">
                    <!-- Sidebar Toggle -->
                    <div class="navbar navbar-inverse">
                        <div class="container-fluid">
                            <div class="navbar-header">
                                <a href="#" class="navbar-brand" id="sidebar-toggle">
                                    <i class="icon-button">${createSidebarToggleIconSVG()}</i>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Notifications -->
                    <div class="header-item">
                        <a href="#" class="notification-click">
                            <i class="icon-bell">${createBellIconSVG()}</i>
                            ${notifications.length > 0 ? `<span class="notification-count">${notifications.length}</span>` : ''}
                        </a>
                        <div class="notification-tooltip" id="notification-tooltip" style="display: none;">
                            ${createNotificationsHTML()}
                        </div>
                    </div>

                    <!-- Theme Toggle -->
                    <div class="header-item">
                        <a href="#" class="theme-toggle" id="theme-toggle">
                            <i class="dark-moon">${createThemeIconSVG()}</i>
                        </a>
                    </div>

                    <!-- User Avatar & Dropdown -->
                    <div class="header-item">
                        <a href="#" class="user-avatar__link">
                            <i class="user-avatar">
                                ${window.siteDashboardData?.currentUser?.avatar ? 
                                  `<img src="${window.siteDashboardData.currentUser.avatar}" alt="User avatar" />` :
                                  `<div class="avatar-placeholder">${window.siteDashboardData?.currentUser?.name?.[0] || 'U'}</div>`}
                            </i>
                        </a>
                        <div class="tooltip-block" id="tooltip-block" style="display: none;">
                            ${createUserDropdownHTML()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createMainContentHTML() {
    return `
        <section id="content-wrapper">
            <div class="container-fluid">
                <div id="portal-content" class="portal-content">
                    ${(!portalData.menu_items || portalData.menu_items.length === 0) ? createEmptyStateHTML() : ''}
                </div>
            </div>
        </section>
    `;
}

function createNotificationsHTML() {
    if (notifications.length === 0) {
        return `
            <div class="notification-tooltip__header">No notifications</div>
            <div class="no-notifications">
                <p>You're all caught up!</p>
            </div>
        `;
    }
    
    return `
        <div class="notification-tooltip__header">Recent notifications</div>
        ${notifications.map(notification => `
            <div class="notification-tooltip__inside">
                <div class="notification-tooltip__inside_img">
                    ${createNotificationIconSVG(notification.type)}
                </div>
                <div class="notification-tooltip__inside_text">
                    <div class="notification-tooltip__inside_title">${notification.title}</div>
                    <div class="notification-tooltip__inside_message">${notification.message}</div>
                </div>
                <div class="notification-tooltip__inside_time">${notification.time}</div>
            </div>
        `).join('')}
    `;
}

function createUserDropdownHTML() {
    const currentUser = window.siteDashboardData?.currentUser || {};
    
    return `
        <span class="romb"></span>
        <div class="row relative align-items-center tooltip-block__header">
            <div class="user-img1">
                ${currentUser.avatar ? `<img src="${currentUser.avatar}" alt="Profile image" />` : 
                  `<div class="avatar-placeholder">${currentUser.name?.[0] || 'U'}</div>`}
            </div>
            <span>${currentUser.name || 'User'}</span>
        </div>
        <hr class="tooltip-block__line" />
        <div class="settings-block">
            <div class="d-flex align-items-center settings-block_item">
                <i class="preferences-icon">${createUserIconSVG()}</i>
                <a href="${window.siteDashboardData?.adminUrl}profile.php">Account preferences</a>
            </div>
            <div class="d-flex align-items-center settings-block_item mt-2">
                <i class="preferences-icon">${createSettingsIconSVG()}</i>
                <a href="${window.siteDashboardData?.adminUrl}">Dashboard</a>
            </div>
            <div class="d-flex align-items-center settings-block_item mt-2">
                <i class="preferences-icon log-out-icon">${createLogoutIconSVG()}</i>
                <a href="${window.siteDashboardData?.adminUrl}wp-login.php?action=logout">Log out</a>
            </div>
        </div>
    `;
}

// Icon creation functions
function createIconSVG(iconName) {
    // Map WordPress/Gutenberg icons to SVG
    const iconMap = {
        'dashboard': 'dashboard',
        'admin-home': 'dashboard',
        'cart': 'shoppingCart',
        'admin-users': 'accountUsers',
        'chart-pie': 'pieChart',
        'admin-settings': 'settingsIcon',
        'store': 'storeMng'
    };
    
    const svgIcon = iconMap[iconName] || iconName;
    return `<svg role="img" class="dashIcon"><use xlink:href="#${svgIcon}"></use></svg>`;
}

function createDefaultIconSVG() {
    return `<svg role="img" class="dashIcon"><use xlink:href="#dashboard"></use></svg>`;
}

function createSearchIconSVG() {
    return `<svg role="img" class="dashIcon accountWidget"><use xlink:href="#searchIcon"></use></svg>`;
}

function createBellIconSVG() {
    return `<svg role="img" class="headerIcon"><use xlink:href="#bellIcon"></use></svg>`;
}

function createThemeIconSVG() {
    return `<svg role="img" class="themeIcon"><use xlink:href="#themeIcon"></use></svg>`;
}

function createSidebarToggleIconSVG() {
    return `<svg role="img" class="headerIcon"><use xlink:href="#sidebarToggle"></use></svg>`;
}

function createChevronSVG() {
    return `<svg role="img" class="upIcon"><use xlink:href="#chevronUp"></use></svg>`;
}

function createTripleDotsIconSVG() {
    return `<svg role="img" class="triplePoint"><use xlink:href="#triplePoint"></use></svg>`;
}

function createUserIconSVG() {
    return `<svg role="img" class="userIcon"><use xlink:href="#accountsPreferences"></use></svg>`;
}

function createSettingsIconSVG() {
    return `<svg role="img" class="userIcon"><use xlink:href="#settingsIcon"></use></svg>`;
}

function createLogoutIconSVG() {
    return `<svg role="img" class="userIcon"><use xlink:href="#logOut"></use></svg>`;
}

function createNotificationIconSVG(type) {
    const iconMap = {
        'message': 'message',
        'warning': 'warningIcon',
        'success': 'whiteCheck',
        'info': 'message'
    };
    const icon = iconMap[type] || 'message';
    return `<svg role="img" class="popover-icon"><use xlink:href="#${icon}"></use></svg>`;
}

// Content loading functions
async function loadPageContent(pageId) {
    const contentArea = document.getElementById('portal-content');
    if (!contentArea) return;
    
    contentArea.innerHTML = createContentLoadingHTML();
    
    try {
        const menuItem = portalData.menu_items.find(item => item.page_id == pageId);
        
        if (menuItem && menuItem.content) {
            displayPageContent(menuItem);
        } else {
            const response = await fetch(`${window.siteDashboardData?.apiUrl.replace('site-dashboard/v1/', 'wp/v2/')}pages/${pageId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.siteDashboardData?.nonce
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status}`);
            }
            
            const page = await response.json();
            displayPageContent({
                ...menuItem,
                title: page.title.rendered,
                content: page.content.rendered,
                excerpt: page.excerpt.rendered
            });
        }
        
        updateActiveMenuItem(pageId);
        
    } catch (error) {
        console.error('Error loading page content:', error);
        contentArea.innerHTML = createContentErrorHTML(error.message);
    }
}

function displayPageContent(pageData) {
    const contentArea = document.getElementById('portal-content');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
        <div class="portal-content-container">
            <div class="portal-content-header">
                <h1 class="portal-page-title">${pageData.title}</h1>
                ${pageData.excerpt ? `<div class="portal-page-excerpt">${pageData.excerpt}</div>` : ''}
            </div>
            <div class="portal-page-content">
                ${pageData.content || ''}
            </div>
        </div>
    `;
}

function updateActiveMenuItem(pageId) {
    const menuItems = document.querySelectorAll('.portal-menu-link');
    menuItems.forEach(item => item.parentElement.classList.remove('active'));
    
    const activeItem = document.querySelector(`[data-page-id="${pageId}"]`);
    if (activeItem) {
        activeItem.parentElement.classList.add('active');
    }
}

function addEventListeners() {
    // Menu item clicks
    document.addEventListener('click', (e) => {
        if (e.target.closest('.portal-menu-link')) {
            e.preventDefault();
            const link = e.target.closest('.portal-menu-link');
            const pageId = link.dataset.pageId;
            if (pageId) {
                loadPageContent(pageId);
            }
        }
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('sidebar-collapsed');
        });
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            isDarkMode = !isDarkMode;
            document.getElementById('wrapper').classList.toggle('dark-theme', isDarkMode);
            localStorage.setItem('portal-dark-mode', isDarkMode);
        });
    }
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('portal-dark-mode');
    if (savedTheme === 'true') {
        isDarkMode = true;
        document.getElementById('wrapper')?.classList.add('dark-theme');
    }
    
    // Search functionality
    const searchField = document.getElementById('search-field');
    if (searchField) {
        searchField.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Dropdown toggles
    setupDropdownToggles();
    
    // Submenu toggles
    setupSubmenuToggles();
}

function handleSearch(e) {
    const query = e.target.value.trim();
    const tooltip = document.getElementById('search-tooltip');
    
    if (query.length < 2) {
        tooltip.style.display = 'none';
        return;
    }
    
    // TODO: Implement search functionality
    tooltip.style.display = 'block';
    document.getElementById('search-results').innerHTML = `
        <div class="search-result">
            <p>Searching for "${query}"...</p>
        </div>
    `;
}

function setupDropdownToggles() {
    // Notification dropdown
    const notificationClick = document.querySelector('.notification-click');
    const notificationTooltip = document.getElementById('notification-tooltip');
    
    if (notificationClick && notificationTooltip) {
        notificationClick.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notificationTooltip.style.display = notificationTooltip.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // User dropdown
    const userAvatarLink = document.querySelector('.user-avatar__link');
    const tooltipBlock = document.getElementById('tooltip-block');
    
    if (userAvatarLink && tooltipBlock) {
        userAvatarLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            tooltipBlock.style.display = tooltipBlock.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        if (notificationTooltip) notificationTooltip.style.display = 'none';
        if (tooltipBlock) tooltipBlock.style.display = 'none';
        const searchTooltip = document.getElementById('search-tooltip');
        if (searchTooltip) searchTooltip.style.display = 'none';
    });
}

function setupSubmenuToggles() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.has-submenu > a')) {
            e.preventDefault();
            const submenuParent = e.target.closest('.has-submenu');
            submenuParent.classList.toggle('open');
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility functions
function createLoadingHTML() {
    return `
        <div class="portal-loading">
            <div class="portal-spinner"></div>
            <p>Loading portal...</p>
        </div>
    `;
}

function createContentLoadingHTML() {
    return `
        <div class="portal-content-loading">
            <div class="portal-spinner small"></div>
            <p>Loading content...</p>
        </div>
    `;
}

function createErrorHTML(message) {
    return `
        <div class="portal-error">
            <div class="portal-error-content">
                <h2>Portal Error</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="portal-button primary">
                    Retry
                </button>
            </div>
        </div>
    `;
}

function createContentErrorHTML(message) {
    return `
        <div class="portal-content-error">
            <h2>Error Loading Content</h2>
            <p>${message}</p>
            <button onclick="location.reload()" class="portal-button primary">
                Retry
            </button>
        </div>
    `;
}

function createEmptyStateHTML() {
    return `
        <div class="portal-empty-state">
            <div class="portal-empty-content">
                <h2>Welcome to the Portal</h2>
                <p>Select a page from the sidebar to get started.</p>
            </div>
        </div>
    `;
} 