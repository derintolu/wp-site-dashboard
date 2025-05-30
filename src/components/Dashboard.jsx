import React, { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

const Dashboard = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [portalData, setPortalData] = useState({
        menu_items: [],
        settings: {},
        widgets: []
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearchTooltip, setShowSearchTooltip] = useState(false);
    const [adminBarHeight, setAdminBarHeight] = useState(0);

    useEffect(() => {
        loadPortalData();
        detectAdminBar();
        
        // Handle dark mode from localStorage
        const savedDarkMode = localStorage.getItem('portal-dark-mode') === 'true';
        setDarkMode(savedDarkMode);
        
        // Handle sidebar state from localStorage
        const savedSidebarState = localStorage.getItem('portal-sidebar-collapsed') === 'true';
        setSidebarCollapsed(savedSidebarState);
    }, []);

    const detectAdminBar = () => {
        // Check if WordPress admin bar exists
        const adminBar = document.getElementById('wpadminbar');
        if (adminBar) {
            const height = adminBar.offsetHeight;
            setAdminBarHeight(height);
        }
    };

    const loadPortalData = async () => {
        try {
            const response = await apiFetch({ path: '/site-dashboard/v1/portal-data' });
            setPortalData(response);
        } catch (error) {
            console.error('Failed to load portal data:', error);
            // Set default data if API fails
            setPortalData({
                menu_items: [
                    { id: 1, title: 'Dashboard', icon: 'dashboard', url: '#', active: true },
                    { id: 2, title: 'Orders', icon: 'cart', url: '#' },
                    { id: 3, title: 'Accounts & Users', icon: 'admin-users', url: '#' },
                    { id: 4, title: 'Finance Reports', icon: 'chart-pie', url: '#' },
                    { id: 5, title: 'Store Management', icon: 'store', url: '#', submenu: [
                        { title: 'Tax Settings', url: '#' },
                        { title: 'POS Setup', url: '#' },
                        { title: 'Referral System', url: '#' }
                    ]},
                    { id: 6, title: 'Settings', icon: 'admin-settings', url: '#' }
                ],
                settings: {
                    portal_title: 'Motherboard Team',
                    portal_subtitle: '10 employees'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('portal-sidebar-collapsed', newState);
    };

    const toggleDarkMode = () => {
        const newState = !darkMode;
        setDarkMode(newState);
        localStorage.setItem('portal-dark-mode', newState);
    };

    const renderIcon = (iconName) => {
        const iconMap = {
            'dashboard': '📊',
            'cart': '🛒',
            'admin-users': '👥',
            'chart-pie': '📈',
            'store': '🏪',
            'admin-settings': '⚙️',
            'search': '🔍',
            'bell': '🔔',
            'user': '👤',
            'menu': '☰'
        };
        
        return <span className="menu-icon">{iconMap[iconName] || '•'}</span>;
    };

    if (loading) {
        return (
            <div className="portal-loading" style={{ paddingTop: `${adminBarHeight}px` }}>
                <div className="loading-spinner"></div>
                <p>{__('Loading portal...', 'site-dashboard')}</p>
            </div>
        );
    }

    return (
        <div className={`portal-wrapper ${darkMode ? 'dark-mode' : ''}`} 
             style={{ paddingTop: `${adminBarHeight}px` }}>
            
            {/* Sidebar */}
            <aside className={`portal-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="user-avatar">
                            <span>M</span>
                        </div>
                        <div className="user-info">
                            <div className="user-name">{portalData.settings?.portal_title || 'Motherboard Team'}</div>
                            <div className="user-subtitle">{portalData.settings?.portal_subtitle || '10 employees'}</div>
                        </div>
                    </div>
                </div>

                <div className="sidebar-section">
                    <div className="sidebar-heading">{__('Marketing Module', 'site-dashboard')}</div>
                    <nav className="sidebar-nav">
                        {portalData.menu_items?.map((item, index) => (
                            <div key={index} className="nav-item-wrapper">
                                <a href={item.url || '#'} className={`nav-item ${item.active ? 'active' : ''}`}>
                                    {renderIcon(item.icon)}
                                    <span className="nav-text">{item.title}</span>
                                    {item.submenu && (
                                        <span className="nav-arrow">⌄</span>
                                    )}
                                </a>
                                {item.submenu && (
                                    <ul className="nav-submenu">
                                        {item.submenu.map((subitem, subindex) => (
                                            <li key={subindex}>
                                                <a href={subitem.url || '#'}>{subitem.title}</a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Progress Widget */}
                <div className="sidebar-widget">
                    <div className="widget-title">{__('Mails left', 'site-dashboard')}</div>
                    <div className="widget-subtitle">{__('5,422 emails', 'site-dashboard')}</div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '35%' }}></div>
                    </div>
                    <button className="widget-button">{__('Upgrade to Pro', 'site-dashboard')}</button>
                </div>

                <div className="sidebar-divider"></div>

                <div className="sidebar-footer">
                    <div className="user-menu">
                        <div className="user-avatar-small">
                            <img src="/wp-content/plugins/wp-site-dashboard/assets/profile.png" 
                                 alt="Profile" 
                                 onError={(e) => e.target.style.display = 'none'} />
                            <span className="fallback-avatar">B</span>
                        </div>
                        <div className="user-info-small">
                            <div className="user-name-small">{__('Boris Johnson', 'site-dashboard')}</div>
                        </div>
                        <button className="user-menu-toggle" 
                                onClick={() => setShowUserMenu(!showUserMenu)}>
                            ⋯
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="portal-main">
                {/* Header */}
                <header className="portal-header">
                    <div className="header-left">
                        <button 
                            className="sidebar-toggle"
                            onClick={toggleSidebar}
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {renderIcon('menu')}
                        </button>
                        
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder={__('Search for data, users...', 'site-dashboard')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSearchTooltip(true)}
                                onBlur={() => setTimeout(() => setShowSearchTooltip(false), 200)}
                                className="search-input"
                            />
                            <button className="search-button">
                                {renderIcon('search')}
                            </button>
                            
                            {showSearchTooltip && searchQuery && (
                                <div className="search-tooltip">
                                    <div className="search-tooltip-header">
                                        {__('12 search results', 'site-dashboard')}
                                    </div>
                                    <div className="search-results">
                                        <div className="search-section">
                                            <div className="search-section-title">{__('People', 'site-dashboard')}</div>
                                            <div className="search-result">
                                                <div className="result-avatar">DR</div>
                                                <div className="result-info">
                                                    <div className="result-name">Darlene Robertson</div>
                                                    <div className="result-title">Sales @ ls.store</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="header-right">
                        <button 
                            className={`header-btn notification-btn ${showNotifications ? 'active' : ''}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                            title={__('Notifications', 'site-dashboard')}
                        >
                            {renderIcon('bell')}
                            <span className="notification-badge">3</span>
                        </button>
                        
                        <button 
                            className={`header-btn theme-btn ${darkMode ? 'active' : ''}`}
                            onClick={toggleDarkMode}
                            title={darkMode ? __('Light mode', 'site-dashboard') : __('Dark mode', 'site-dashboard')}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        
                        <button 
                            className="user-avatar-header"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            title={__('User menu', 'site-dashboard')}
                        >
                            <img src="/wp-content/plugins/wp-site-dashboard/assets/profile.png" 
                                 alt="Profile" 
                                 onError={(e) => {
                                     e.target.style.display = 'none';
                                     e.target.nextSibling.style.display = 'flex';
                                 }} />
                            <span className="fallback-avatar" style={{display: 'none'}}>U</span>
                        </button>
                    </div>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                {__('Recent notifications', 'site-dashboard')}
                            </div>
                            <div className="notification-item">
                                <div className="notification-icon message">💬</div>
                                <div className="notification-content">
                                    <div className="notification-title">1 new message from Storytale</div>
                                    <div className="notification-text">Hello there, i just wanted to ask if there are...</div>
                                </div>
                                <div className="notification-time">2 hr ago</div>
                            </div>
                            <div className="notification-item">
                                <div className="notification-icon warning">⚠️</div>
                                <div className="notification-content">
                                    <div className="notification-title">Your subscription ending soon</div>
                                    <div className="notification-text">Don't forget to renew Craftwork subscription</div>
                                </div>
                                <div className="notification-time">3 days ago</div>
                            </div>
                            <div className="notification-footer">
                                <button className="show-all-btn">{__('Show all', 'site-dashboard')}</button>
                            </div>
                        </div>
                    )}

                    {/* User Menu Dropdown */}
                    {showUserMenu && (
                        <div className="user-dropdown">
                            <div className="user-dropdown-header">
                                <div className="user-avatar-large">U</div>
                                <span>Darlene</span>
                            </div>
                            <div className="user-dropdown-divider"></div>
                            <div className="user-dropdown-menu">
                                <a href="#" className="dropdown-item">
                                    <span className="dropdown-icon">👤</span>
                                    {__('Account preferences', 'site-dashboard')}
                                </a>
                                <a href="#" className="dropdown-item">
                                    <span className="dropdown-icon">💳</span>
                                    {__('Subscription', 'site-dashboard')}
                                </a>
                                <a href="#" className="dropdown-item logout">
                                    <span className="dropdown-icon">🚪</span>
                                    {__('Log out', 'site-dashboard')}
                                </a>
                            </div>
                        </div>
                    )}
                </header>

                {/* Content Area */}
                <main className="portal-content">
                    <div className="content-header">
                        <h1>{__('Dashboard', 'site-dashboard')}</h1>
                        <p>{__('Welcome to your portal dashboard', 'site-dashboard')}</p>
                    </div>

                    <div className="dashboard-grid">
                        {/* Analytics Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>📊 {__('Analytics', 'site-dashboard')}</h3>
                                <div className="card-menu">⋯</div>
                            </div>
                            <div className="card-content">
                                <div className="metric">
                                    <div className="metric-value">1,234</div>
                                    <div className="metric-label">{__('Total Users', 'site-dashboard')}</div>
                                </div>
                                <div className="metric-change positive">
                                    <span className="change-icon">↗</span>
                                    +12%
                                </div>
                            </div>
                        </div>

                        {/* Revenue Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>💰 {__('Revenue', 'site-dashboard')}</h3>
                                <div className="card-menu">⋯</div>
                            </div>
                            <div className="card-content">
                                <div className="metric">
                                    <div className="metric-value">$45,678</div>
                                    <div className="metric-label">{__('This Month', 'site-dashboard')}</div>
                                </div>
                                <div className="metric-change positive">
                                    <span className="change-icon">↗</span>
                                    +8%
                                </div>
                            </div>
                        </div>

                        {/* Growth Card */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>📈 {__('Growth', 'site-dashboard')}</h3>
                                <div className="card-menu">⋯</div>
                            </div>
                            <div className="card-content">
                                <div className="metric">
                                    <div className="metric-value">23.5%</div>
                                    <div className="metric-label">{__('Month over Month', 'site-dashboard')}</div>
                                </div>
                                <div className="metric-change positive">
                                    <span className="change-icon">↗</span>
                                    +3.2%
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="dashboard-card activity-card">
                            <div className="card-header">
                                <h3>📋 {__('Recent Activity', 'site-dashboard')}</h3>
                                <button className="filter-btn">{__('Filter', 'site-dashboard')}</button>
                            </div>
                            <div className="card-content">
                                <div className="activity-list">
                                    <div className="activity-item">
                                        <div className="activity-icon">👤</div>
                                        <div className="activity-content">
                                            <div className="activity-title">{__('New user registered', 'site-dashboard')}</div>
                                            <div className="activity-time">{__('2 minutes ago', 'site-dashboard')}</div>
                                        </div>
                                        <div className="activity-status success"></div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon">💳</div>
                                        <div className="activity-content">
                                            <div className="activity-title">{__('Payment received', 'site-dashboard')}</div>
                                            <div className="activity-time">{__('15 minutes ago', 'site-dashboard')}</div>
                                        </div>
                                        <div className="activity-status success"></div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon">📊</div>
                                        <div className="activity-content">
                                            <div className="activity-title">{__('Report generated', 'site-dashboard')}</div>
                                            <div className="activity-time">{__('1 hour ago', 'site-dashboard')}</div>
                                        </div>
                                        <div className="activity-status info"></div>
                                    </div>
                                    <div className="activity-item">
                                        <div className="activity-icon">⚠️</div>
                                        <div className="activity-content">
                                            <div className="activity-title">{__('System maintenance scheduled', 'site-dashboard')}</div>
                                            <div className="activity-time">{__('2 hours ago', 'site-dashboard')}</div>
                                        </div>
                                        <div className="activity-status warning"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Overlay for mobile sidebar */}
            {!sidebarCollapsed && (
                <div className="sidebar-overlay" onClick={toggleSidebar}></div>
            )}
        </div>
    );
};

export default Dashboard; 