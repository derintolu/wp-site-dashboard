import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
    Card,
    CardBody,
    CardHeader,
    TextControl,
    SelectControl,
    Button,
    ColorPicker,
    Notice,
    Spinner,
    FormFileUpload,
    TabPanel,
    __experimentalHeading as Heading,
    __experimentalSpacer as Spacer,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
} from '@wordpress/components';
import { cog, palette, pages } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';

const Settings = () => {
    const [pagesData, setPagesData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [settings, setSettings] = useState({
        assignedPages: [],
        dashboardRoute: '/dashboard',
        allowedRoles: ['administrator'],
        loginLogo: '',
        loginBgColor: '#ffffff',
        loginAccentColor: '#2271b1',
        loginTagline: '',
        loginBgImage: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [initError, setInitError] = useState(null);

    useEffect(() => {
        initializeSettings();
    }, []);

    const initializeSettings = async () => {
        setLoading(true);
        setInitError(null);
        
        try {
            // Load settings first (most important)
            const settingsRes = await apiFetch({ 
                path: '/site-dashboard/v1/settings',
                method: 'GET'
            }).catch(err => {
                console.error('Settings API error:', err);
                return null;
            });
            
            if (settingsRes) {
                setSettings(prevSettings => ({ ...prevSettings, ...settingsRes }));
            }

            // Load roles (for user access settings)
            const rolesRes = await apiFetch({ 
                path: '/site-dashboard/v1/roles',
                method: 'GET'
            }).catch(err => {
                console.error('Roles API error:', err);
                // Fallback to default roles
                return [
                    { slug: 'administrator', name: 'Administrator' },
                    { slug: 'editor', name: 'Editor' },
                    { slug: 'author', name: 'Author' }
                ];
            });
            
            setRoles(rolesRes || []);

            // Load pages (for page assignment)
            const pagesRes = await apiFetch({ 
                path: '/wp/v2/pages?per_page=100',
                method: 'GET'
            }).catch(err => {
                console.error('Pages API error:', err);
                return [];
            });
            
            setPagesData(pagesRes || []);

        } catch (err) {
            console.error('Failed to initialize settings:', err);
            setInitError(__('Failed to load settings. Please refresh the page and try again.', 'site-dashboard'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setNotice(null);
        
        try {
            const response = await apiFetch({
                path: '/site-dashboard/v1/settings',
                method: 'POST',
                data: settings,
            });
            
            if (response && response.success) {
                setNotice({ 
                    status: 'success', 
                    message: __('Settings saved successfully!', 'site-dashboard') 
                });
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Save error:', err);
            setNotice({ 
                status: 'error', 
                message: err.message || __('Failed to save settings. Please try again.', 'site-dashboard')
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="portal-settings-loading">
                <Spinner />
                <p>{__('Loading settings...', 'site-dashboard')}</p>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="portal-settings-error">
                <Notice status="error" isDismissible={false}>
                    {initError}
                </Notice>
                <Button variant="primary" onClick={initializeSettings} style={{ marginTop: '16px' }}>
                    {__('Retry', 'site-dashboard')}
                </Button>
            </div>
        );
    }

    const tabs = [
        {
            name: 'general',
            title: __('General Settings', 'site-dashboard'),
            icon: cog,
            content: (
                <VStack spacing={4}>
                    <Card>
                        <CardHeader>
                            <Heading level={3}>{__('Dashboard Configuration', 'site-dashboard')}</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4}>
                                <TextControl
                                    label={__('Dashboard Route', 'site-dashboard')}
                                    value={settings.dashboardRoute}
                                    onChange={dashboardRoute => setSettings(s => ({ ...s, dashboardRoute }))}
                                    help={__('Set the frontend route for the dashboard (e.g., /dashboard)', 'site-dashboard')}
                                />
                                {roles.length > 0 && (
                                    <SelectControl
                                        multiple
                                        label={__('Allowed User Roles', 'site-dashboard')}
                                        value={settings.allowedRoles}
                                        options={roles.map(role => ({ label: role.name, value: role.slug }))}
                                        onChange={allowedRoles => setSettings(s => ({ ...s, allowedRoles }))}
                                        help={__('Select which user roles can access the portal', 'site-dashboard')}
                                    />
                                )}
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>
            )
        },
        {
            name: 'login',
            title: __('Login Page', 'site-dashboard'),
            icon: palette,
            content: (
                <VStack spacing={4}>
                    <Card>
                        <CardHeader>
                            <Heading level={3}>{__('Branding & Colors', 'site-dashboard')}</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={4}>
                                <FormFileUpload
                                    accept="image/*"
                                    onChange={file => setSettings(s => ({ ...s, loginLogo: file }))}
                                    render={({ openFileDialog }) => (
                                        <Button onClick={openFileDialog} variant="secondary">
                                            {settings.loginLogo ? __('Change Logo', 'site-dashboard') : __('Upload Logo', 'site-dashboard')}
                                        </Button>
                                    )}
                                />
                                <div className="portal-color-picker-group">
                                    <Heading level={4}>{__('Background Color', 'site-dashboard')}</Heading>
                                    <ColorPicker
                                        color={settings.loginBgColor}
                                        onChangeComplete={color => setSettings(s => ({ ...s, loginBgColor: color.hex }))}
                                    />
                                </div>
                                <div className="portal-color-picker-group">
                                    <Heading level={4}>{__('Accent Color', 'site-dashboard')}</Heading>
                                    <ColorPicker
                                        color={settings.loginAccentColor}
                                        onChangeComplete={color => setSettings(s => ({ ...s, loginAccentColor: color.hex }))}
                                    />
                                </div>
                                <TextControl
                                    label={__('Login Tagline', 'site-dashboard')}
                                    value={settings.loginTagline}
                                    onChange={loginTagline => setSettings(s => ({ ...s, loginTagline }))}
                                    help={__('Optional tagline to display on the login page', 'site-dashboard')}
                                />
                                <FormFileUpload
                                    accept="image/*"
                                    onChange={file => setSettings(s => ({ ...s, loginBgImage: file }))}
                                    render={({ openFileDialog }) => (
                                        <Button onClick={openFileDialog} variant="secondary">
                                            {settings.loginBgImage ? __('Change Background Image', 'site-dashboard') : __('Upload Background Image', 'site-dashboard')}
                                        </Button>
                                    )}
                                />
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>
            )
        },
        {
            name: 'pages',
            title: __('Page Assignment', 'site-dashboard'),
            icon: pages,
            content: (
                <VStack spacing={4}>
                    <Card>
                        <CardHeader>
                            <Heading level={3}>{__('Dashboard Pages', 'site-dashboard')}</Heading>
                        </CardHeader>
                        <CardBody>
                            {pagesData.length > 0 ? (
                                <SelectControl
                                    multiple
                                    label={__('Assign Pages to Dashboard', 'site-dashboard')}
                                    value={settings.assignedPages}
                                    options={pagesData.map(page => ({ label: page.title.rendered, value: String(page.id) }))}
                                    onChange={assignedPages => setSettings(s => ({ ...s, assignedPages }))}
                                    help={__('Select which WordPress pages should appear in the portal dashboard', 'site-dashboard')}
                                />
                            ) : (
                                <p>{__('No pages found. Create some pages first.', 'site-dashboard')}</p>
                            )}
                        </CardBody>
                    </Card>
                </VStack>
            )
        }
    ];

    return (
        <div className="portal-settings-app">
            <div className="portal-settings-layout">
                <div className="portal-settings-content">
                    <div className="portal-settings-header">
                        <Heading level={1}>{__('Portal Settings', 'site-dashboard')}</Heading>
                        <p>{__('Configure your portal dashboard, login page, and user access settings.', 'site-dashboard')}</p>
                    </div>
                    
                    <Spacer />
                    
                    {notice && (
                        <Notice status={notice.status} isDismissible onRemove={() => setNotice(null)}>
                            {notice.message}
                        </Notice>
                    )}
                    
                    <TabPanel
                        className="portal-settings-tabs"
                        activeClass="active-tab"
                        tabs={tabs}
                    >
                        {(tab) => (
                            <div className="portal-settings-tab-content">
                                {tab.content}
                            </div>
                        )}
                    </TabPanel>
                    
                    {/* Save Button */}
                    <div className="portal-settings-save-bar">
                        <Button 
                            variant="primary" 
                            onClick={handleSave} 
                            disabled={saving}
                            className="portal-settings-save-button"
                        >
                            {saving ? __('Saving...', 'site-dashboard') : __('Save Settings', 'site-dashboard')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 