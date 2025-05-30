// src/components/Dashboard.jsx
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Notice,
    Spinner,
    __experimentalHeading as Heading,
    __experimentalSpacer as Spacer,
    __experimentalVStack as VStack,
    __experimentalHStack as HStack,
    Flex,
    FlexItem,
    FlexBlock,
} from '@wordpress/components';
import { 
    dashboard,
    pages,
    users,
    postComments,
    chartLine,
    cog,
    external
} from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';
import {
    SiteAdmin,
    SiteHub,
    Sidebar,
    SidebarNavigationItem,
    SidebarNavigationScreen,
    SidebarButton,
    Page
} from '@automattic/site-admin';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState('overview');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await apiFetch({ 
                path: '/site-dashboard/v1/stats',
                method: 'GET'
            });
            setStats(response);
        } catch (err) {
            console.error('Dashboard loading error:', err);
            setError(__('Failed to load dashboard data. Please refresh and try again.', 'site-dashboard'));
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color = '#5344F4' }) => (
        <Card className="portal-stat-card">
            <CardBody>
                <HStack alignment="space-between" className="portal-stat-header">
                    <div className="portal-stat-icon" style={{ backgroundColor: `${color}15`, color }}>
                        {icon}
                    </div>
                    <div className="portal-stat-content">
                        <div className="portal-stat-value">{value}</div>
                        <div className="portal-stat-title">{title}</div>
                    </div>
                </HStack>
            </CardBody>
        </Card>
    );

    const QuickAction = ({ title, description, icon, onClick, href }) => (
        <Card className="portal-quick-action">
            <CardBody>
                <VStack spacing={3}>
                    <div className="portal-action-icon">
                        {icon}
                    </div>
                    <div className="portal-action-content">
                        <Heading level={4}>{title}</Heading>
                        <p>{description}</p>
                    </div>
                    {href ? (
                        <Button 
                            variant="secondary" 
                            href={href}
                            icon={external}
                            iconPosition="right"
                        >
                            {__('Open', 'site-dashboard')}
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={onClick}>
                            {__('Open', 'site-dashboard')}
                        </Button>
                    )}
                </VStack>
            </CardBody>
        </Card>
    );

    if (loading) {
        return (
            <div className="portal-dashboard-loading">
                <Spinner />
                <p>{__('Loading your dashboard...', 'site-dashboard')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="portal-dashboard-error">
                <Notice status="error" isDismissible={false}>
                    {error}
                </Notice>
                <Button variant="primary" onClick={loadDashboardData} style={{ marginTop: '16px' }}>
                    {__('Retry', 'site-dashboard')}
                </Button>
            </div>
        );
    }

    return (
        <div className="portal-dashboard-app">
            <SiteAdmin>
                <Sidebar>
                    <SiteHub 
                        title={__('Portal Dashboard', 'site-dashboard')}
                        subtitle={window.siteDashboardData?.siteName || __('Your Site', 'site-dashboard')}
                    />
                    
                    <SidebarNavigationScreen path="/">
                        <SidebarNavigationItem
                            uid="overview"
                            title={__('Overview', 'site-dashboard')}
                            icon={dashboard}
                            onClick={() => setCurrentPage('overview')}
                            isActive={currentPage === 'overview'}
                        />
                        <SidebarNavigationItem
                            uid="analytics"
                            title={__('Analytics', 'site-dashboard')}
                            icon={chartLine}
                            onClick={() => setCurrentPage('analytics')}
                            isActive={currentPage === 'analytics'}
                        />
                        <SidebarNavigationItem
                            uid="content"
                            title={__('Content', 'site-dashboard')}
                            icon={pages}
                            onClick={() => setCurrentPage('content')}
                            isActive={currentPage === 'content'}
                        />
                        <SidebarNavigationItem
                            uid="users"
                            title={__('Users', 'site-dashboard')}
                            icon={users}
                            onClick={() => setCurrentPage('users')}
                            isActive={currentPage === 'users'}
                        />
                    </SidebarNavigationScreen>

                    <div className="portal-sidebar-footer">
                        <SidebarButton
                            icon={cog}
                            href={`${window.siteDashboardData?.adminUrl}admin.php?page=site-dashboard-settings`}
                        >
                            {__('Settings', 'site-dashboard')}
                        </SidebarButton>
                    </div>
                </Sidebar>

                <Page>
                    {currentPage === 'overview' && (
                        <div className="portal-dashboard-content">
                            <div className="portal-dashboard-header">
                                <Heading level={1}>{__('Dashboard Overview', 'site-dashboard')}</Heading>
                                <p>{__('Welcome to your site portal. Here\'s a quick overview of your site.', 'site-dashboard')}</p>
                            </div>

                            <Spacer />

                            {/* Stats Grid */}
                            <div className="portal-stats-grid">
                                <StatCard
                                    title={__('Total Posts', 'site-dashboard')}
                                    value={stats?.posts_count || 0}
                                    icon={pages}
                                    color="#5344F4"
                                />
                                <StatCard
                                    title={__('Total Pages', 'site-dashboard')}
                                    value={stats?.pages_count || 0}
                                    icon={pages}
                                    color="#00A32A"
                                />
                                <StatCard
                                    title={__('Total Users', 'site-dashboard')}
                                    value={stats?.users_count || 0}
                                    icon={users}
                                    color="#FF6B6B"
                                />
                                <StatCard
                                    title={__('Comments', 'site-dashboard')}
                                    value={stats?.comments_count || 0}
                                    icon={postComments}
                                    color="#FFB800"
                                />
                            </div>

                            <Spacer />

                            {/* Quick Actions */}
                            <div className="portal-section">
                                <Heading level={2}>{__('Quick Actions', 'site-dashboard')}</Heading>
                                <div className="portal-quick-actions-grid">
                                    <QuickAction
                                        title={__('Create New Post', 'site-dashboard')}
                                        description={__('Write and publish a new blog post', 'site-dashboard')}
                                        icon={pages}
                                        href={`${window.siteDashboardData?.adminUrl}post-new.php`}
                                    />
                                    <QuickAction
                                        title={__('Manage Pages', 'site-dashboard')}
                                        description={__('Edit your site pages and content', 'site-dashboard')}
                                        icon={pages}
                                        href={`${window.siteDashboardData?.adminUrl}edit.php?post_type=page`}
                                    />
                                    <QuickAction
                                        title={__('User Management', 'site-dashboard')}
                                        description={__('Add or edit user accounts', 'site-dashboard')}
                                        icon={users}
                                        href={`${window.siteDashboardData?.adminUrl}users.php`}
                                    />
                                    <QuickAction
                                        title={__('Site Settings', 'site-dashboard')}
                                        description={__('Configure your portal settings', 'site-dashboard')}
                                        icon={cog}
                                        href={`${window.siteDashboardData?.adminUrl}admin.php?page=site-dashboard-settings`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentPage === 'analytics' && (
                        <div className="portal-dashboard-content">
                            <div className="portal-dashboard-header">
                                <Heading level={1}>{__('Analytics', 'site-dashboard')}</Heading>
                                <p>{__('View your site analytics and performance metrics.', 'site-dashboard')}</p>
                            </div>
                            <Card>
                                <CardBody>
                                    <p>{__('Analytics features coming soon...', 'site-dashboard')}</p>
                                </CardBody>
                            </Card>
                        </div>
                    )}

                    {currentPage === 'content' && (
                        <div className="portal-dashboard-content">
                            <div className="portal-dashboard-header">
                                <Heading level={1}>{__('Content Management', 'site-dashboard')}</Heading>
                                <p>{__('Manage your posts, pages, and media.', 'site-dashboard')}</p>
                            </div>
                            <Card>
                                <CardBody>
                                    <p>{__('Content management features coming soon...', 'site-dashboard')}</p>
                                </CardBody>
                            </Card>
                        </div>
                    )}

                    {currentPage === 'users' && (
                        <div className="portal-dashboard-content">
                            <div className="portal-dashboard-header">
                                <Heading level={1}>{__('User Management', 'site-dashboard')}</Heading>
                                <p>{__('Manage user accounts and permissions.', 'site-dashboard')}</p>
                            </div>
                            <Card>
                                <CardBody>
                                    <p>{__('User management features coming soon...', 'site-dashboard')}</p>
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </Page>
            </SiteAdmin>
        </div>
    );
};

export default Dashboard;