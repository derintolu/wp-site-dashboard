import { render } from '@wordpress/element';
import { 
    Panel, 
    PanelBody, 
    PanelHeader,
    Card,
    CardBody,
    CardHeader,
    Button,
    TextControl,
    SelectControl,
    ToggleControl,
    ColorPicker,
    Dashicon,
    Notice,
    Spinner,
    Modal,
    TextareaControl,
    RangeControl,
    __experimentalNumberControl as NumberControl,
    MediaUpload,
    MediaUploadCheck,
    __experimentalHStack as HStack,
    __experimentalVStack as VStack,
    Icon
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import './admin.scss';

const { siteDashboardAdmin } = window;

// Expanded icon library with more WordPress/Gutenberg icons
const AVAILABLE_ICONS = {
    // Dashboard & Home
    'dashboard': __('Dashboard', 'site-dashboard'),
    'admin-home': __('Home', 'site-dashboard'),
    'admin-site': __('Site', 'site-dashboard'),
    
    // E-commerce
    'cart': __('Shopping Cart', 'site-dashboard'),
    'store': __('Store', 'site-dashboard'),
    'products': __('Products', 'site-dashboard'),
    'money': __('Money', 'site-dashboard'),
    'bank': __('Bank', 'site-dashboard'),
    
    // Users & People
    'admin-users': __('Users', 'site-dashboard'),
    'groups': __('Groups', 'site-dashboard'),
    'businessman': __('Business Person', 'site-dashboard'),
    'buddicons-buddypress-logo': __('Community', 'site-dashboard'),
    
    // Analytics & Charts
    'chart-pie': __('Pie Chart', 'site-dashboard'),
    'chart-bar': __('Bar Chart', 'site-dashboard'),
    'chart-line': __('Line Chart', 'site-dashboard'),
    'chart-area': __('Area Chart', 'site-dashboard'),
    'analytics': __('Analytics', 'site-dashboard'),
    'performance': __('Performance', 'site-dashboard'),
    
    // Settings & Tools
    'admin-settings': __('Settings', 'site-dashboard'),
    'admin-tools': __('Tools', 'site-dashboard'),
    'admin-generic': __('Generic Admin', 'site-dashboard'),
    'admin-network': __('Network', 'site-dashboard'),
    'controls-repeat': __('Controls', 'site-dashboard'),
    
    // Content & Media
    'admin-page': __('Pages', 'site-dashboard'),
    'admin-post': __('Posts', 'site-dashboard'),
    'admin-media': __('Media', 'site-dashboard'),
    'admin-links': __('Links', 'site-dashboard'),
    'admin-comments': __('Comments', 'site-dashboard'),
    'admin-appearance': __('Appearance', 'site-dashboard'),
    'admin-plugins': __('Plugins', 'site-dashboard'),
    
    // Communication
    'email': __('Email', 'site-dashboard'),
    'email-alt': __('Newsletter', 'site-dashboard'),
    'phone': __('Phone', 'site-dashboard'),
    'megaphone': __('Megaphone', 'site-dashboard'),
    'bell': __('Notifications', 'site-dashboard'),
    'feedback': __('Feedback', 'site-dashboard'),
    
    // Navigation & Location
    'location': __('Location', 'site-dashboard'),
    'location-alt': __('Location Alt', 'site-dashboard'),
    'migrate': __('Transfer', 'site-dashboard'),
    'arrow-up': __('Arrow Up', 'site-dashboard'),
    'arrow-down': __('Arrow Down', 'site-dashboard'),
    'arrow-left': __('Arrow Left', 'site-dashboard'),
    'arrow-right': __('Arrow Right', 'site-dashboard'),
    
    // Time & Calendar
    'calendar': __('Calendar', 'site-dashboard'),
    'calendar-alt': __('Calendar Alt', 'site-dashboard'),
    'clock': __('Clock', 'site-dashboard'),
    'schedule': __('Schedule', 'site-dashboard'),
    
    // Favorites & Actions
    'star-filled': __('Star Filled', 'site-dashboard'),
    'star-empty': __('Star Empty', 'site-dashboard'),
    'heart': __('Heart', 'site-dashboard'),
    'lightbulb': __('Lightbulb', 'site-dashboard'),
    'thumbs-up': __('Thumbs Up', 'site-dashboard'),
    'thumbs-down': __('Thumbs Down', 'site-dashboard'),
    
    // Status & Info
    'yes': __('Success', 'site-dashboard'),
    'no': __('Error', 'site-dashboard'),
    'warning': __('Warning', 'site-dashboard'),
    'info': __('Info', 'site-dashboard'),
    'marker': __('Marker', 'site-dashboard'),
    
    // Documents & Files
    'media-document': __('Document', 'site-dashboard'),
    'media-archive': __('Archive', 'site-dashboard'),
    'media-code': __('Code', 'site-dashboard'),
    'backup': __('Backup', 'site-dashboard'),
    'database': __('Database', 'site-dashboard'),
    
    // Custom SVG option
    'custom-svg': __('Custom SVG', 'site-dashboard')
};

const WIDGET_TYPES = {
    'progress': __('Progress Widget', 'site-dashboard'),
    'stats': __('Stats Widget', 'site-dashboard'),
    'custom': __('Custom Widget', 'site-dashboard'),
    'pattern': __('WordPress Pattern', 'site-dashboard')
};

const AdminApp = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [settings, setSettings] = useState({});
    const [menuItems, setMenuItems] = useState([]);
    const [widgets, setWidgets] = useState([]);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [showWidgetModal, setShowWidgetModal] = useState(false);
    const [editingWidget, setEditingWidget] = useState(null);
    const [customSvgs, setCustomSvgs] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load portal pages from custom post type - handle gracefully if none exist
            let formattedPages = [];
            try {
                const pagesResponse = await apiFetch({ 
                    path: '/wp/v2/portal-pages',
                    method: 'GET',
                    data: {
                        per_page: 100,
                        status: 'publish',
                        orderby: 'title',
                        order: 'asc'
                    }
                });
                
                formattedPages = pagesResponse.map(page => ({
                    id: page.id,
                    title: page.title.rendered,
                    slug: page.slug
                }));
            } catch (pagesError) {
                console.warn('Portal pages not available yet:', pagesError);
                // This is expected if no portal pages exist yet
                formattedPages = [];
            }
            
            setPages(formattedPages);
            
            // Load other data
            const [settingsData, menuData, widgetsData] = await Promise.all([
                apiFetch({ path: '/site-dashboard/v1/settings' }).catch(err => {
                    console.error('Settings API error:', err);
                    return { general: {} };
                }),
                apiFetch({ path: '/site-dashboard/v1/menu-items' }).catch(err => {
                    console.error('Menu items API error:', err);
                    return [];
                }),
                apiFetch({ path: '/site-dashboard/v1/widgets' }).catch(err => {
                    console.error('Widgets API error:', err);
                    return [];
                })
            ]);
            
            setSettings(settingsData.general || {});
            setMenuItems(menuData || []);
            setWidgets(widgetsData || []);
            
            // Load custom SVGs from settings
            setCustomSvgs(settingsData.general?.custom_svgs || {});
            
        } catch (error) {
            console.error('Load data error:', error);
            setNotice({ type: 'error', message: __('Failed to load some data. The plugin may still be initializing. Please refresh and try again.', 'site-dashboard') });
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const settingsToSave = {
                ...settings,
                custom_svgs: customSvgs
            };
            await apiFetch({
                path: '/site-dashboard/v1/settings',
                method: 'POST',
                data: { general: settingsToSave }
            });
            setNotice({ type: 'success', message: __('Settings saved successfully!', 'site-dashboard') });
        } catch (error) {
            setNotice({ type: 'error', message: __('Failed to save settings', 'site-dashboard') });
        } finally {
            setSaving(false);
        }
    };

    const saveMenuItems = async () => {
        try {
            setSaving(true);
            await apiFetch({
                path: '/site-dashboard/v1/menu-items',
                method: 'POST',
                data: menuItems
            });
            setNotice({ type: 'success', message: __('Menu items saved successfully!', 'site-dashboard') });
        } catch (error) {
            setNotice({ type: 'error', message: __('Failed to save menu items', 'site-dashboard') });
        } finally {
            setSaving(false);
        }
    };

    const saveWidgets = async () => {
        try {
            setSaving(true);
            await apiFetch({
                path: '/site-dashboard/v1/widgets',
                method: 'POST',
                data: widgets
            });
            setNotice({ type: 'success', message: __('Widgets saved successfully!', 'site-dashboard') });
        } catch (error) {
            setNotice({ type: 'error', message: __('Failed to save widgets', 'site-dashboard') });
        } finally {
            setSaving(false);
        }
    };

    const addMenuItem = () => {
        setMenuItems([...menuItems, {
            page_id: '',
            title: '',
            icon: '',
            custom_route: '',
            order: menuItems.length,
            children: []
        }]);
    };

    const updateMenuItem = (index, field, value) => {
        const updated = [...menuItems];
        updated[index][field] = value;
        
        // Auto-fill title from selected page
        if (field === 'page_id' && value) {
            const selectedPage = pages.find(page => page.id.toString() === value.toString());
            if (selectedPage && !updated[index].title) {
                updated[index].title = selectedPage.title;
            }
        }
        
        setMenuItems(updated);
    };

    const removeMenuItem = (index) => {
        const updated = menuItems.filter((_, i) => i !== index);
        setMenuItems(updated);
    };

    const addWidget = (widgetData) => {
        const newWidget = {
            id: Date.now(),
            order: widgets.length,
            ...widgetData
        };
        setWidgets([...widgets, newWidget]);
        setShowWidgetModal(false);
        setEditingWidget(null);
    };

    const updateWidget = (widgetData) => {
        const updated = widgets.map(w => w.id === editingWidget.id ? { ...editingWidget, ...widgetData } : w);
        setWidgets(updated);
        setShowWidgetModal(false);
        setEditingWidget(null);
    };

    const removeWidget = (widgetId) => {
        const updated = widgets.filter(w => w.id !== widgetId);
        setWidgets(updated);
    };

    const uploadCustomSvg = (media, iconKey) => {
        if (media && media.url && media.url.endsWith('.svg')) {
            const newCustomSvgs = {
                ...customSvgs,
                [iconKey]: {
                    url: media.url,
                    name: media.title || media.filename
                }
            };
            setCustomSvgs(newCustomSvgs);
        }
    };

    const IconSelector = ({ value, onChange, itemIndex }) => {
        const [showCustomUpload, setShowCustomUpload] = useState(false);
        
        return (
            <VStack spacing={3}>
                <SelectControl
                    label={__('Icon', 'site-dashboard')}
                    value={value}
                    options={[
                        { label: __('No icon', 'site-dashboard'), value: '' },
                        ...Object.entries(AVAILABLE_ICONS).map(([key, label]) => ({ 
                            label: label, 
                            value: key 
                        })),
                        ...Object.entries(customSvgs).map(([key, svg]) => ({
                            label: `${svg.name} (Custom)`,
                            value: `custom-${key}`
                        }))
                    ]}
                    onChange={(selectedValue) => {
                        if (selectedValue === 'custom-svg') {
                            setShowCustomUpload(true);
                        } else {
                            onChange(selectedValue);
                        }
                    }}
                />
                
                {value && (
                    <div className="icon-preview">
                        <label>{__('Icon Preview:', 'site-dashboard')}</label>
                        <div className="icon-preview-display">
                            {value.startsWith('custom-') ? (
                                <img 
                                    src={customSvgs[value.replace('custom-', '')]?.url} 
                                    alt="Custom icon"
                                    style={{ width: '24px', height: '24px' }}
                                />
                            ) : (
                                <Dashicon icon={value} size={24} />
                            )}
                            <span>{AVAILABLE_ICONS[value] || customSvgs[value.replace('custom-', '')]?.name}</span>
                        </div>
                    </div>
                )}
                
                <MediaUploadCheck>
                    <MediaUpload
                        onSelect={(media) => {
                            const customKey = `item-${itemIndex}-${Date.now()}`;
                            uploadCustomSvg(media, customKey);
                            onChange(`custom-${customKey}`);
                            setShowCustomUpload(false);
                        }}
                        allowedTypes={['image']}
                        value={null}
                        render={({ open }) => (
                            <Button 
                                onClick={open}
                                variant="secondary"
                                icon="upload"
                            >
                                {__('Upload Custom SVG', 'site-dashboard')}
                            </Button>
                        )}
                    />
                </MediaUploadCheck>
                
                {showCustomUpload && (
                    <Notice status="info" isDismissible={false}>
                        <p>{__('Please upload an SVG file for your custom icon. SVG files work best for crisp, scalable icons.', 'site-dashboard')}</p>
                    </Notice>
                )}
            </VStack>
        );
    };

    const DashboardView = () => (
        <div className="portal-admin-dashboard">
            <div className="portal-admin-header">
                <div>
                    <h1>{__('Portal Dashboard', 'site-dashboard')}</h1>
                    <p>{__('Configure your portal settings, navigation menu, and sidebar widgets.', 'site-dashboard')}</p>
                </div>
            </div>

            <div className="portal-admin-grid">
                <Card>
                    <CardHeader>
                        <h2><Dashicon icon="admin-settings" /> {__('Portal Settings', 'site-dashboard')}</h2>
                    </CardHeader>
                    <CardBody>
                        <p>{__('Configure portal appearance, colors, and behavior settings.', 'site-dashboard')}</p>
                        <Button 
                            variant="secondary" 
                            onClick={() => setCurrentView('settings')}
                        >
                            {__('Manage Settings', 'site-dashboard')}
                        </Button>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2><Dashicon icon="menu" /> {__('Navigation Menu', 'site-dashboard')}</h2>
                    </CardHeader>
                    <CardBody>
                        <p>{__('Assign WordPress pages to appear in the sidebar navigation with custom icons.', 'site-dashboard')}</p>
                        <div className="menu-stats">
                            <strong>{menuItems.length}</strong> {__('menu items configured', 'site-dashboard')}
                        </div>
                        <Button 
                            variant="secondary" 
                            onClick={() => setCurrentView('menu')}
                        >
                            {__('Manage Navigation', 'site-dashboard')}
                        </Button>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2><Dashicon icon="admin-plugins" /> {__('Sidebar Widgets', 'site-dashboard')}</h2>
                    </CardHeader>
                    <CardBody>
                        <p>{__('Create progress bars, stats displays, and custom widgets for the sidebar.', 'site-dashboard')}</p>
                        <div className="widget-stats">
                            <strong>{widgets.length}</strong> {__('widgets created', 'site-dashboard')}
                        </div>
                        <Button 
                            variant="secondary" 
                            onClick={() => setCurrentView('widgets')}
                        >
                            {__('Manage Widgets', 'site-dashboard')}
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );

    const SettingsView = () => (
        <div className="portal-admin-settings">
            <div className="portal-admin-header">
                <Button 
                    variant="tertiary" 
                    onClick={() => setCurrentView('dashboard')}
                    style={{ marginBottom: '16px' }}
                >
                    ← {__('Back to Dashboard', 'site-dashboard')}
                </Button>
                <h1>{__('Portal Settings', 'site-dashboard')}</h1>
            </div>

            <div className="settings-sections">
                <Card>
                    <CardHeader>
                        <h2>{__('General Settings', 'site-dashboard')}</h2>
                    </CardHeader>
                    <CardBody>
                        <TextControl
                            label={__('Portal Title', 'site-dashboard')}
                            value={settings.portal_title || ''}
                            onChange={(value) => setSettings({...settings, portal_title: value})}
                            help={__('The title displayed in the sidebar header.', 'site-dashboard')}
                        />

                        <ToggleControl
                            label={__('Show Search Bar', 'site-dashboard')}
                            checked={settings.show_search !== false}
                            onChange={(value) => setSettings({...settings, show_search: value})}
                            help={__('Display search functionality in the top header.', 'site-dashboard')}
                        />

                        <ToggleControl
                            label={__('Show Notifications', 'site-dashboard')}
                            checked={settings.show_notifications !== false}
                            onChange={(value) => setSettings({...settings, show_notifications: value})}
                            help={__('Display notification bell in the top header.', 'site-dashboard')}
                        />

                        <ToggleControl
                            label={__('Enable Dark Mode Toggle', 'site-dashboard')}
                            checked={settings.enable_dark_mode !== false}
                            onChange={(value) => setSettings({...settings, enable_dark_mode: value})}
                            help={__('Allow users to toggle between light and dark themes.', 'site-dashboard')}
                        />
                        
                        <hr style={{margin: '24px 0'}} />
                        
                        <h3>{__('Portal Routing', 'site-dashboard')}</h3>
                        
                        <TextControl
                            label={__('Portal Base Route', 'site-dashboard')}
                            value={settings.portal_route || 'portal'}
                            onChange={(value) => setSettings({...settings, portal_route: value})}
                            help={__('The base URL path for the portal (e.g., "portal" creates /portal). Leave empty to disable frontend routing.', 'site-dashboard')}
                            placeholder="portal"
                        />
                        
                        <TextControl
                            label={__('Dashboard Page Route', 'site-dashboard')}
                            value={settings.dashboard_route || 'dashboard'}
                            onChange={(value) => setSettings({...settings, dashboard_route: value})}
                            help={__('The route for the main dashboard page (e.g., "dashboard" creates /portal/dashboard).', 'site-dashboard')}
                            placeholder="dashboard"
                        />
                        
                        <ToggleControl
                            label={__('Enable Custom URLs', 'site-dashboard')}
                            checked={settings.enable_custom_urls !== false}
                            onChange={(value) => setSettings({...settings, enable_custom_urls: value})}
                            help={__('Allow each menu item to have a custom URL route instead of using page IDs.', 'site-dashboard')}
                        />
                        
                        {settings.portal_route && (
                            <Notice status="info" isDismissible={false}>
                                <p>
                                    <strong>{__('Current Portal URLs:', 'site-dashboard')}</strong><br />
                                    • {__('Main Portal:', 'site-dashboard')} <code>/{settings.portal_route}</code><br />
                                    • {__('Dashboard:', 'site-dashboard')} <code>/{settings.portal_route}/{settings.dashboard_route || 'dashboard'}</code><br />
                                    • {__('Pages:', 'site-dashboard')} <code>/{settings.portal_route}/[page-route]</code>
                                </p>
                                <p style={{marginTop: '12px', fontSize: '14px', color: '#646970'}}>
                                    {__('Note: After changing routes, visit Settings > Permalinks to flush rewrite rules.', 'site-dashboard')}
                                </p>
                            </Notice>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h2>{__('Color Scheme', 'site-dashboard')}</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="color-controls">
                            <div className="color-control">
                                <label>{__('Primary Color', 'site-dashboard')}</label>
                                <ColorPicker
                                    color={settings.primary_color || '#2271b1'}
                                    onChange={(color) => setSettings({...settings, primary_color: color})}
                                />
                                <p className="description">{__('Used for buttons, active states, and accents.', 'site-dashboard')}</p>
                            </div>

                            <div className="color-control">
                                <label>{__('Sidebar Background', 'site-dashboard')}</label>
                                <ColorPicker
                                    color={settings.sidebar_background || '#ffffff'}
                                    onChange={(color) => setSettings({...settings, sidebar_background: color})}
                                />
                                <p className="description">{__('Background color for the left sidebar.', 'site-dashboard')}</p>
                            </div>

                            <div className="color-control">
                                <label>{__('Header Background', 'site-dashboard')}</label>
                                <ColorPicker
                                    color={settings.header_background || '#ffffff'}
                                    onChange={(color) => setSettings({...settings, header_background: color})}
                                />
                                <p className="description">{__('Background color for the top header.', 'site-dashboard')}</p>
                            </div>

                            <div className="color-control">
                                <label>{__('Content Background', 'site-dashboard')}</label>
                                <ColorPicker
                                    color={settings.content_background || '#f0f0f1'}
                                    onChange={(color) => setSettings({...settings, content_background: color})}
                                />
                                <p className="description">{__('Background color for the main content area.', 'site-dashboard')}</p>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <div className="save-section">
                    <Button 
                        variant="primary" 
                        onClick={saveSettings}
                        isBusy={saving}
                        disabled={saving}
                    >
                        {saving ? __('Saving...', 'site-dashboard') : __('Save Settings', 'site-dashboard')}
                    </Button>
                </div>
            </div>
        </div>
    );

    const MenuView = () => (
        <div className="portal-admin-menu">
            <div className="portal-admin-header">
                <Button 
                    variant="tertiary" 
                    onClick={() => setCurrentView('dashboard')}
                    style={{ marginBottom: '16px' }}
                >
                    ← {__('Back to Dashboard', 'site-dashboard')}
                </Button>
                <div>
                    <h1>{__('Navigation Menu', 'site-dashboard')}</h1>
                    <p>{__('Configure the sidebar navigation menu with portal pages and icons.', 'site-dashboard')}</p>
                    {pages.length === 0 && (
                        <Notice status="info" isDismissible={false}>
                            <p>
                                {__('No portal pages found. ', 'site-dashboard')}
                                <a href={`${siteDashboardAdmin.adminUrl}edit.php?post_type=portal_page`} target="_blank">
                                    {__('Create your first portal page', 'site-dashboard')}
                                </a>
                                {__(' to get started with navigation.', 'site-dashboard')}
                            </p>
                        </Notice>
                    )}
                </div>
                <HStack>
                    <Button 
                        variant="secondary"
                        href={`${siteDashboardAdmin.adminUrl}edit.php?post_type=portal_page`}
                        target="_blank"
                    >
                        <Dashicon icon="admin-page" /> {__('Manage Portal Pages', 'site-dashboard')}
                    </Button>
                    <Button variant="primary" onClick={addMenuItem} disabled={pages.length === 0}>
                        <Dashicon icon="plus" /> {__('Add Menu Item', 'site-dashboard')}
                    </Button>
                </HStack>
            </div>

            <div className="menu-items-list">
                {menuItems.map((item, index) => (
                    <Card key={index} className="menu-item-card">
                        <CardBody>
                            <div className="menu-item-controls">
                                <SelectControl
                                    label={__('Portal Page', 'site-dashboard')}
                                    value={item.page_id}
                                    options={[
                                        { label: __('Select a portal page...', 'site-dashboard'), value: '' },
                                        ...pages.map(page => ({ label: page.title, value: page.id }))
                                    ]}
                                    onChange={(value) => updateMenuItem(index, 'page_id', value)}
                                    help={__('Choose a portal page to display when this menu item is clicked.', 'site-dashboard')}
                                />

                                <TextControl
                                    label={__('Menu Title', 'site-dashboard')}
                                    value={item.title}
                                    onChange={(value) => updateMenuItem(index, 'title', value)}
                                    help={__('Override the page title in navigation.', 'site-dashboard')}
                                />

                                <IconSelector value={item.icon} onChange={(value) => updateMenuItem(index, 'icon', value)} itemIndex={index} />

                                <NumberControl
                                    label={__('Order', 'site-dashboard')}
                                    value={item.order || 0}
                                    onChange={(value) => updateMenuItem(index, 'order', parseInt(value))}
                                />

                                {settings.enable_custom_urls && (
                                    <TextControl
                                        label={__('Custom Route', 'site-dashboard')}
                                        value={item.custom_route || ''}
                                        onChange={(value) => updateMenuItem(index, 'custom_route', value)}
                                        help={__('Custom URL path for this page (e.g., "my-page" creates /portal/my-page). Leave empty to use page ID.', 'site-dashboard')}
                                        placeholder="custom-page-url"
                                    />
                                )}

                                <div className="menu-item-actions">
                                    <Button
                                        variant="secondary"
                                        isDestructive
                                        onClick={() => removeMenuItem(index)}
                                    >
                                        <Dashicon icon="trash" /> {__('Remove', 'site-dashboard')}
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {menuItems.length === 0 && (
                <div className="empty-state">
                    <p>{__('No menu items configured yet. Add your first menu item to get started.', 'site-dashboard')}</p>
                </div>
            )}

            <div className="save-section">
                <Button 
                    variant="primary" 
                    onClick={saveMenuItems}
                    isBusy={saving}
                    disabled={saving}
                >
                    {saving ? __('Saving...', 'site-dashboard') : __('Save Menu Items', 'site-dashboard')}
                </Button>
            </div>
        </div>
    );

    const WidgetsView = () => (
        <div className="portal-admin-widgets">
            <div className="portal-admin-header">
                <Button 
                    variant="tertiary" 
                    onClick={() => setCurrentView('dashboard')}
                    style={{ marginBottom: '16px' }}
                >
                    ← {__('Back to Dashboard', 'site-dashboard')}
                </Button>
                <div>
                    <h1>{__('Sidebar Widgets', 'site-dashboard')}</h1>
                    <p>{__('Create and manage widgets that appear in the sidebar below the navigation.', 'site-dashboard')}</p>
                </div>
                <Button variant="primary" onClick={() => setShowWidgetModal(true)}>
                    <Dashicon icon="plus" /> {__('Create Widget', 'site-dashboard')}
                </Button>
            </div>

            <div className="widgets-grid">
                {widgets.map((widget) => (
                    <Card key={widget.id} className="widget-card">
                        <CardHeader>
                            <h3>{widget.title}</h3>
                            <span className="widget-type">{WIDGET_TYPES[widget.type]}</span>
                        </CardHeader>
                        <CardBody>
                            <p>{widget.subtitle || widget.description || __('No description', 'site-dashboard')}</p>
                            {widget.type === 'progress' && (
                                <div className="widget-preview">
                                    <div className="progress-preview">
                                        <div style={{ width: `${widget.percentage || 35}%`, height: '8px', background: '#2271b1', borderRadius: '4px' }}></div>
                                    </div>
                                    <small>{widget.percentage || 35}% complete</small>
                                </div>
                            )}
                            <div className="widget-actions">
                                <Button 
                                    variant="secondary" 
                                    size="small"
                                    onClick={() => {
                                        setEditingWidget(widget);
                                        setShowWidgetModal(true);
                                    }}
                                >
                                    <Dashicon icon="edit" /> {__('Edit', 'site-dashboard')}
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    size="small" 
                                    isDestructive
                                    onClick={() => removeWidget(widget.id)}
                                >
                                    <Dashicon icon="trash" /> {__('Delete', 'site-dashboard')}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {widgets.length === 0 && (
                <div className="empty-state">
                    <p>{__('No widgets created yet. Add your first widget to enhance the sidebar.', 'site-dashboard')}</p>
                </div>
            )}

            <div className="save-section">
                <Button 
                    variant="primary" 
                    onClick={saveWidgets}
                    isBusy={saving}
                    disabled={saving}
                >
                    {saving ? __('Saving...', 'site-dashboard') : __('Save Widgets', 'site-dashboard')}
                </Button>
            </div>
        </div>
    );

    const WidgetModal = () => {
        const [widgetData, setWidgetData] = useState(editingWidget || {
            type: 'progress',
            title: '',
            subtitle: '',
            percentage: 35,
            content: '',
            button_text: '',
            button_link: ''
        });

        const handleSave = () => {
            if (editingWidget) {
                updateWidget(widgetData);
            } else {
                addWidget(widgetData);
            }
        };

        return (
            <Modal
                title={editingWidget ? __('Edit Widget', 'site-dashboard') : __('Create Widget', 'site-dashboard')}
                onRequestClose={() => {
                    setShowWidgetModal(false);
                    setEditingWidget(null);
                }}
                className="widget-modal"
            >
                <div className="widget-form">
                    <SelectControl
                        label={__('Widget Type', 'site-dashboard')}
                        value={widgetData.type}
                        options={Object.entries(WIDGET_TYPES).map(([value, label]) => ({ value, label }))}
                        onChange={(value) => setWidgetData({...widgetData, type: value})}
                    />

                    <TextControl
                        label={__('Widget Title', 'site-dashboard')}
                        value={widgetData.title}
                        onChange={(value) => setWidgetData({...widgetData, title: value})}
                    />

                    <TextControl
                        label={__('Subtitle', 'site-dashboard')}
                        value={widgetData.subtitle}
                        onChange={(value) => setWidgetData({...widgetData, subtitle: value})}
                    />

                    {widgetData.type === 'progress' && (
                        <>
                            <RangeControl
                                label={__('Progress Percentage', 'site-dashboard')}
                                value={widgetData.percentage || 35}
                                onChange={(value) => setWidgetData({...widgetData, percentage: value})}
                                min={0}
                                max={100}
                            />

                            <TextControl
                                label={__('Button Text', 'site-dashboard')}
                                value={widgetData.button_text}
                                onChange={(value) => setWidgetData({...widgetData, button_text: value})}
                            />

                            <TextControl
                                label={__('Button Link', 'site-dashboard')}
                                value={widgetData.button_link}
                                onChange={(value) => setWidgetData({...widgetData, button_link: value})}
                            />
                        </>
                    )}

                    {(widgetData.type === 'stats' || widgetData.type === 'custom') && (
                        <TextareaControl
                            label={__('Content', 'site-dashboard')}
                            value={widgetData.content}
                            onChange={(value) => setWidgetData({...widgetData, content: value})}
                            help={__('HTML content for the widget.', 'site-dashboard')}
                        />
                    )}

                    <div className="modal-actions">
                        <Button 
                            variant="primary" 
                            onClick={handleSave}
                        >
                            {editingWidget ? __('Update Widget', 'site-dashboard') : __('Create Widget', 'site-dashboard')}
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                setShowWidgetModal(false);
                                setEditingWidget(null);
                            }}
                        >
                            {__('Cancel', 'site-dashboard')}
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    };

    if (loading) {
        return (
            <div className="portal-admin-loading">
                <Spinner />
                <p>{__('Loading...', 'site-dashboard')}</p>
            </div>
        );
    }

    return (
        <div className="portal-admin-app">
            {notice && (
                <Notice 
                    status={notice.type} 
                    onRemove={() => setNotice(null)}
                    dismissible
                >
                    {notice.message}
                </Notice>
            )}

            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'menu' && <MenuView />}
            {currentView === 'widgets' && <WidgetsView />}

            {showWidgetModal && <WidgetModal />}
        </div>
    );
};

// Initialize the admin app
document.addEventListener('DOMContentLoaded', () => {
    const adminRoot = document.getElementById('site-dashboard-admin-root');
    if (adminRoot) {
        render(<AdminApp />, adminRoot);
    }
}); 