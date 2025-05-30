import { render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import domReady from '@wordpress/dom-ready';

// Import the main dashboard component using @automattic/site-admin
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

// Import styles
import './style.scss';

// Initialize the dashboard when DOM is ready
domReady(() => {
    console.log('Site Dashboard: DOM ready, checking for elements and data...');
    console.log('Available data:', { 
        siteDashboardData: window.siteDashboardData,
        settingsPage: window.siteDashboardData?.settingsPage 
    });

    if (window.siteDashboardData && window.siteDashboardData.settingsPage) {
        const settingsRoot = document.getElementById('site-dashboard-settings-root');
        if (settingsRoot) {
            console.log('Site Dashboard: Rendering Settings component');
            render(<Settings />, settingsRoot);
        } else {
            console.error('Site Dashboard: Settings root element not found.');
        }
    } else {
        const rootElement = document.getElementById('site-dashboard-root');
        if (rootElement) {
            console.log('Site Dashboard: Rendering Dashboard component');
            console.log('Frontend data available:', window.siteDashboardData);

            // Render the main dashboard component
            render(<Dashboard />, rootElement);
        } else {
            console.error('Site Dashboard: Root element not found. Make sure the PHP plugin is properly enqueuing this script.');
        }
    }
});

// Optional: Handle hot module replacement for development
if (module.hot) {
    module.hot.accept(['./components/Dashboard', './components/Settings'], () => {
        const NextDashboard = require('./components/Dashboard').default;
        const NextSettings = require('./components/Settings').default;
        if (window.siteDashboardData && window.siteDashboardData.settingsPage) {
            const settingsRoot = document.getElementById('site-dashboard-settings-root');
            if (settingsRoot) {
                render(<NextSettings />, settingsRoot);
            }
        } else {
            const rootElement = document.getElementById('site-dashboard-root');
            if (rootElement) {
                render(<NextDashboard />, rootElement);
            }
        }
    });
} 