<?php
/**
 * Plugin Name: Site Dashboard
 * Description: A modern portal dashboard with WordPress patterns and modern components
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: site-dashboard
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class SiteDashboardPlugin {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('init', [$this, 'load_textdomain']);
        add_action('init', [$this, 'register_custom_post_types']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_shortcode('site_dashboard', [$this, 'render_frontend_dashboard']);
        add_action('init', [$this, 'add_rewrite_rules']);
        add_action('wp_loaded', [$this, 'maybe_flush_rewrite_rules']);
        add_action('template_redirect', [$this, 'handle_frontend_routes']);
        add_filter('query_vars', [$this, 'add_query_vars']);
        
        // Register activation/deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate_plugin']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate_plugin']);
    }
    
    /**
     * Load plugin textdomain
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'site-dashboard',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }
    
    /**
     * Add admin menu items
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Portal', 'site-dashboard'),
            __('Portal', 'site-dashboard'),
            'manage_options',
            'site-dashboard',
            [$this, 'render_admin_page'],
            'dashicons-admin-home',
            2
        );
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our admin page
        if ($hook !== 'toplevel_page_site-dashboard') {
            return;
        }
        
        $asset_file = include(plugin_dir_path(__FILE__) . 'build/admin.asset.php');
        
        wp_enqueue_script(
            'site-dashboard-admin',
            plugin_dir_url(__FILE__) . 'build/admin.js',
            $asset_file['dependencies'],
            $asset_file['version'],
            true
        );
        
        wp_enqueue_style(
            'site-dashboard-admin-style',
            plugin_dir_url(__FILE__) . 'build/admin.css',
            ['wp-components'],
            $asset_file['version']
        );
        
        wp_localize_script(
            'site-dashboard-admin',
            'siteDashboardAdmin',
            [
                'apiUrl' => rest_url('site-dashboard/v1/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'currentUser' => get_current_user_id(),
                'adminUrl' => admin_url(),
                'pluginUrl' => plugin_dir_url(__FILE__),
                'gutenbergIcons' => $this->get_gutenberg_icons(),
                'pages' => $this->get_pages_for_admin(),
                'patterns' => $this->get_block_patterns()
            ]
        );
    }
    
    /**
     * Get Gutenberg block icons for the admin interface
     */
    public function get_gutenberg_icons() {
        return [
            'admin-home' => __('Home', 'site-dashboard'),
            'admin-appearance' => __('Appearance', 'site-dashboard'),
            'admin-plugins' => __('Plugins', 'site-dashboard'),
            'admin-users' => __('Users', 'site-dashboard'),
            'admin-tools' => __('Tools', 'site-dashboard'),
            'admin-settings' => __('Settings', 'site-dashboard'),
            'admin-network' => __('Network', 'site-dashboard'),
            'admin-generic' => __('Generic', 'site-dashboard'),
            'admin-comments' => __('Comments', 'site-dashboard'),
            'admin-media' => __('Media', 'site-dashboard'),
            'admin-links' => __('Links', 'site-dashboard'),
            'admin-page' => __('Page', 'site-dashboard'),
            'admin-post' => __('Post', 'site-dashboard'),
            'dashboard' => __('Dashboard', 'site-dashboard'),
            'businessman' => __('Business', 'site-dashboard'),
            'groups' => __('Groups', 'site-dashboard'),
            'chart-pie' => __('Analytics', 'site-dashboard'),
            'chart-bar' => __('Reports', 'site-dashboard'),
            'chart-line' => __('Trends', 'site-dashboard'),
            'chart-area' => __('Statistics', 'site-dashboard'),
            'money' => __('Finance', 'site-dashboard'),
            'products' => __('Products', 'site-dashboard'),
            'cart' => __('Cart', 'site-dashboard'),
            'store' => __('Store', 'site-dashboard'),
            'migrate' => __('Transfer', 'site-dashboard'),
            'backup' => __('Backup', 'site-dashboard'),
            'database' => __('Database', 'site-dashboard'),
            'code-standards' => __('Code', 'site-dashboard'),
            'performance' => __('Performance', 'site-dashboard'),
            'analytics' => __('Analytics', 'site-dashboard'),
            'feedback' => __('Feedback', 'site-dashboard'),
            'megaphone' => __('Announcements', 'site-dashboard'),
            'email' => __('Email', 'site-dashboard'),
            'email-alt' => __('Newsletter', 'site-dashboard'),
            'bell' => __('Notifications', 'site-dashboard'),
            'warning' => __('Warnings', 'site-dashboard'),
            'info' => __('Information', 'site-dashboard'),
            'yes' => __('Success', 'site-dashboard'),
            'no' => __('Error', 'site-dashboard')
        ];
    }
    
    /**
     * Get pages for admin interface
     */
    public function get_pages_for_admin() {
        $pages = get_posts([
            'post_type' => 'portal_page',
            'post_status' => 'publish',
            'numberposts' => 100,
            'orderby' => 'title',
            'order' => 'ASC'
        ]);
        
        $formatted_pages = [];
        foreach ($pages as $page) {
            $formatted_pages[] = [
                'value' => $page->ID,
                'label' => $page->post_title
            ];
        }
        
        return $formatted_pages;
    }
    
    /**
     * Get block patterns for widgets
     */
    public function get_block_patterns() {
        if (!class_exists('WP_Block_Patterns_Registry')) {
            return [];
        }
        
        $patterns = WP_Block_Patterns_Registry::get_instance()->get_all_registered();
        $formatted_patterns = [];
        
        foreach ($patterns as $pattern) {
            $formatted_patterns[] = [
                'name' => $pattern['name'],
                'title' => $pattern['title'],
                'description' => $pattern['description'] ?? '',
                'content' => $pattern['content']
            ];
        }
        
        return $formatted_patterns;
    }
    
    /**
     * Render the React-based admin page
     */
    public function render_admin_page() {
        echo '<div id="site-dashboard-admin-root"></div>';
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_assets() {
        $asset_file = include(plugin_dir_path(__FILE__) . 'build/index.asset.php');
        
        wp_enqueue_script(
            'site-dashboard',
            plugin_dir_url(__FILE__) . 'build/index.js',
            ['wp-element', 'wp-components', 'wp-i18n', 'wp-api-fetch', 'wp-dom-ready'],
            $asset_file['version'],
            true
        );
        
        wp_enqueue_style(
            'site-dashboard-style',
            plugin_dir_url(__FILE__) . 'build/style-index.css',
            ['wp-components'],
            $asset_file['version']
        );
        
        wp_localize_script(
            'site-dashboard',
            'siteDashboardData',
            [
                'apiUrl' => rest_url('site-dashboard/v1/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'currentUser' => get_current_user_id(),
                'adminUrl' => admin_url(),
                'pluginUrl' => plugin_dir_url(__FILE__),
                'isAdmin' => false,
                'settingsPage' => false,
            ]
        );
    }
    
    /**
     * Render frontend dashboard shortcode
     */
    public function render_frontend_dashboard($atts) {
        // Add SVG icons to the page
        $this->add_svg_icons();
        
        $this->enqueue_frontend_assets();
        
        $atts = shortcode_atts([
            'style' => 'default'
        ], $atts);
        
        return '<div id="site-dashboard-root" data-style="' . esc_attr($atts['style']) . '"></div>';
    }
    
    /**
     * Add SVG icon definitions to the page
     */
    private function add_svg_icons() {
        if (!wp_script_is('site-dashboard', 'enqueued')) {
            return;
        }
        
        echo '<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                <symbol id="dashboard" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.333 10.833h5A.834.834 0 009.167 10V3.333a.833.833 0 00-.834-.833h-5a.833.833 0 00-.833.833V10a.833.833 0 00.833.833zM2.5 16.667a.833.833 0 00.833.833h5a.833.833 0 00.834-.833v-3.334a.833.833 0 00-.834-.833h-5a.833.833 0 00-.833.833v3.334zm8.333 0a.833.833 0 00.834.833h5a.833.833 0 00.833-.833v-5.834a.833.833 0 00-.833-.833h-5a.833.833 0 00-.834.833v5.834zm.834-8.334h5A.833.833 0 0017.5 7.5V3.333a.833.833 0 00-.833-.833h-5a.833.833 0 00-.834.833V7.5a.833.833 0 00.834.833z" />
                </symbol>
                
                <symbol id="shoppingCart" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path opacity=".4" d="M3.333 5.345L.631 2.643 1.81 1.464l2.702 2.703h12.701a.833.833 0 01.799 1.072l-2 6.667a.834.834 0 01-.799.594H5v1.667h9.167v1.666h-10A.833.833 0 013.333 15V5.345zm1.25 13.822a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                </symbol>
                
                <symbol id="accountUsers" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.086 10.453a5.001 5.001 0 005.45-8.155 5 5 0 10-5.45 8.155z"/>
                    <path opacity=".4" d="M16.666 18.333H3.333v-1.666A4.167 4.167 0 017.5 12.5h5a4.167 4.167 0 014.166 4.167v1.666z"/>
                </symbol>
                
                <symbol id="pieChart" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.4" d="M9.16667 1.70834V10.8333H18.2917C17.8742 15.0442 14.3208 18.3333 10 18.3333C5.3975 18.3333 1.66667 14.6025 1.66667 10C1.66667 5.67917 4.95583 2.12584 9.16667 1.70834V1.70834ZM10.8333 1.70834C12.7458 1.901 14.533 2.74869 15.8921 4.10787C17.2513 5.46704 18.099 7.25418 18.2917 9.16667H10.8333V1.70834Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.8921 4.10787C14.533 2.74869 12.7458 1.901 10.8333 1.70834V9.16667H18.2917C18.099 7.25418 17.2513 5.46704 15.8921 4.10787Z"/>
                </symbol>
                
                <symbol id="settingsIcon" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.445 3.787a8.325 8.325 0 012.951-1.706 3.327 3.327 0 004.048.923c.45-.217.847-.532 1.159-.923a8.333 8.333 0 012.952 1.706 3.329 3.329 0 001.225 3.966c.413.282.884.467 1.379.542a8.369 8.369 0 010 3.408 3.33 3.33 0 00-2.824 3.044c-.038.499.037 1 .22 1.465a8.323 8.323 0 01-2.952 1.706A3.327 3.327 0 0010 16.666a3.328 3.328 0 00-2.604 1.251 8.325 8.325 0 01-2.951-1.706 3.328 3.328 0 00-1.226-3.965 3.326 3.326 0 00-1.379-.542 8.37 8.37 0 010-3.41 3.328 3.328 0 002.824-3.043 3.328 3.328 0 00-.22-1.464zm6.805 8.377a2.5 2.5 0 10-2.472-4.347 2.5 2.5 0 002.472 4.347z"/>
                </symbol>
                
                <symbol id="storeMng" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path opacity=".4" d="M17.5 16.667a.833.833 0 01-.833.833H3.333a.833.833 0 01-.833-.833V7.908a.833.833 0 01.322-.658l6.666-5.185a.833.833 0 011.024 0l6.666 5.185a.832.832 0 01.322.658v8.759z" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.333 17.5H10V1.89a.833.833 0 00-.512.175L2.822 7.25a.833.833 0 00-.322.658v8.759a.833.833 0 00.833.833z"/>
                </symbol>
                
                <symbol id="searchIcon" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.167 1.667c4.14 0 7.5 3.36 7.5 7.5 0 4.14-3.36 7.5-7.5 7.5-4.14 0-7.5-3.36-7.5-7.5 0-4.14 3.36-7.5 7.5-7.5zm0 13.333A5.832 5.832 0 0015 9.167a5.832 5.832 0 00-5.833-5.834 5.831 5.831 0 00-5.833 5.834A5.832 5.832 0 009.167 15zm7.07.06l2.358 2.356-1.179 1.179-2.357-2.357 1.179-1.179z" fill="#000"/>
                </symbol>
                
                <symbol id="bellIcon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.667 14.1666H18.3337V15.8333H1.66699V14.1666H3.33366V8.33329C3.33366 6.56518 4.03604 4.86949 5.28628 3.61925C6.53652 2.36901 8.23222 1.66663 10.0003 1.66663C11.7684 1.66663 13.4641 2.36901 14.7144 3.61925C15.9646 4.86949 16.667 6.56518 16.667 8.33329V14.1666ZM7.50033 17.5H12.5003V19.1666H7.50033V17.5Z" fill="black"/>
                </symbol>
                
                <symbol id="themeIcon" width="18.16" height="18.16" viewBox="0 0 19 19" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.99993 9.82306C8.84656 8.66924 8.06108 7.19942 7.74276 5.59934C7.42444 3.99925 7.58756 2.34072 8.21152 0.833313C6.43251 1.18353 4.7984 2.05643 3.51818 3.3404C-0.0613997 6.91998 -0.0613997 12.7243 3.51818 16.3039C7.09868 19.8844 12.9021 19.8835 16.4826 16.3039C17.7662 15.0238 18.6391 13.3901 18.9897 11.6115C17.4823 12.2353 15.8238 12.3984 14.2237 12.0801C12.6236 11.7617 11.1538 10.9763 9.99993 9.82306Z"/>
                </symbol>
                
                <symbol id="sidebarToggle" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 10.8325V16.6667C17.5 16.8877 17.421 17.0996 17.2803 17.2559C17.1397 17.4122 16.9489 17.5 16.75 17.5H10.75V10.8325H17.5ZM9.25 10.8325V17.5H3.25C3.05109 17.5 2.86032 17.4122 2.71967 17.2559C2.57902 17.0996 2.5 16.8877 2.5 16.6667V10.8325H9.25ZM9.25 2.5V9.16583H2.5V3.33333C2.5 3.11232 2.57902 2.90036 2.71967 2.74408C2.86032 2.5878 3.05109 2.5 3.25 2.5H9.25ZM16.75 2.5C16.9489 2.5 17.1397 2.5878 17.2803 2.74408C17.421 2.90036 17.5 3.11232 17.5 3.33333V9.16583H10.75V2.5H16.75Z" fill="black"/>
                </symbol>
                
                <symbol id="chevronUp" width="10" height="7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.22 6.03L5 2.81 1.78 6.03.72 4.97 5 .69l4.28 4.28-1.06 1.06z" fill="#B2B2B2"/>
                </symbol>
                
                <symbol id="triplePoint" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 2.25c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5zm0 10.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5zM9 7.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5S9.825 7.5 9 7.5z" />
                </symbol>
                
                <symbol id="accountsPreferences" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 11.667v1.666a5 5 0 00-5 5H3.333A6.667 6.667 0 0110 11.667zm0-.834c-2.763 0-5-2.237-5-5 0-2.762 2.237-5 5-5a5 5 0 015 5c0 2.763-2.238 5-5 5zm0-1.666A3.332 3.332 0 1010 2.5a3.332 3.332 0 100 6.667zm2.162 6.51a2.924 2.924 0 010-1.353l-.827-.477.834-1.444.826.478a2.914 2.914 0 011.171-.677v-.954h1.667v.954a2.91 2.91 0 011.17.677l.828-.478.833 1.444-.827.477c.106.445.106.908 0 1.352l.827.477-.834 1.444-.826-.478a2.913 2.913 0 01-1.171.677v.954h-1.667v-.954a2.914 2.914 0 01-1.17-.677l-.827.478-.834-1.444.827-.476zM15 16.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fill="#fff" opacity=".5"/>
                </symbol>
                
                <symbol id="logOut" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.333 15H5v1.667h10V3.333H5V5H3.333V2.5a.833.833 0 01.833-.833h11.667a.833.833 0 01.833.833v15a.833.833 0 01-.833.833H4.166a.833.833 0 01-.833-.833V15zM5 9.167h5.833v1.666H5v2.5L.833 10 5 6.667v2.5z" fill="#fff" opacity=".5"/>
                </symbol>
                
                <symbol id="message" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.303 12.667L1.333 15V2.667A.667.667 0 012 2h12a.667.667 0 01.666.667V12a.667.667 0 01-.666.667H4.303zm.363-6V8H6V6.667H4.666zm2.667 0V8h1.333V6.667H7.333zm2.667 0V8h1.333V6.667H10z" fill="#fff"/>
                </symbol>
                
                <symbol id="warningIcon" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 14.667A6.667 6.667 0 118 1.334a6.667 6.667 0 010 13.333zM7.333 10v1.333h1.333V10H7.333zm0-5.333v4h1.333v-4H7.333z" fill="#fff"/>
                </symbol>
                
                <symbol id="whiteCheck" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.666 10.115l6.128-6.129.944.943L6.666 12 2.424 7.757l.942-.942 3.3 3.3z" fill="#fff"/>
                </symbol>
            </defs>
        </svg>';
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('site-dashboard/v1', '/settings', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'handle_settings'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        register_rest_route('site-dashboard/v1', '/menu-items', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'handle_menu_items'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        register_rest_route('site-dashboard/v1', '/widgets', [
            'methods' => ['GET', 'POST', 'DELETE'],
            'callback' => [$this, 'handle_widgets'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        register_rest_route('site-dashboard/v1', '/portal-data', [
            'methods' => 'GET',
            'callback' => [$this, 'get_portal_data'],
            'permission_callback' => '__return_true'
        ]);
    }
    
    /**
     * Handle settings API requests
     */
    public function handle_settings($request) {
        if ($request->get_method() === 'GET') {
            return rest_ensure_response([
                'general' => get_option('site_dashboard_general_settings', [
                    'portal_title' => 'Portal',
                    'show_user_menu' => true,
                    'portal_background' => '#f0f0f1',
                    'sidebar_background' => '#ffffff',
                    'accent_color' => '#2271b1',
                    'portal_route' => 'portal',
                    'dashboard_route' => 'dashboard',
                    'enable_custom_urls' => false,
                    'show_search' => true,
                    'show_notifications' => true,
                    'enable_dark_mode' => true,
                    'custom_svgs' => []
                ])
            ]);
        }
        
        if ($request->get_method() === 'POST') {
            $data = $request->get_json_params();
            
            if (isset($data['general'])) {
                $settings = $data['general'];
                
                // Sanitize settings
                $sanitized_settings = [
                    'portal_title' => sanitize_text_field($settings['portal_title'] ?? 'Portal'),
                    'show_user_menu' => (bool)($settings['show_user_menu'] ?? true),
                    'portal_background' => sanitize_hex_color($settings['portal_background'] ?? '#f0f0f1'),
                    'sidebar_background' => sanitize_hex_color($settings['sidebar_background'] ?? '#ffffff'),
                    'accent_color' => sanitize_hex_color($settings['accent_color'] ?? '#2271b1'),
                    'portal_route' => sanitize_title($settings['portal_route'] ?? 'portal'),
                    'dashboard_route' => sanitize_title($settings['dashboard_route'] ?? 'dashboard'),
                    'enable_custom_urls' => (bool)($settings['enable_custom_urls'] ?? false),
                    'show_search' => (bool)($settings['show_search'] ?? true),
                    'show_notifications' => (bool)($settings['show_notifications'] ?? true),
                    'enable_dark_mode' => (bool)($settings['enable_dark_mode'] ?? true),
                    'custom_svgs' => $this->sanitize_custom_svgs($settings['custom_svgs'] ?? [])
                ];
                
                // Check if routing settings changed
                $current_settings = get_option('site_dashboard_general_settings', []);
                $route_changed = (
                    ($current_settings['portal_route'] ?? '') !== $sanitized_settings['portal_route'] ||
                    ($current_settings['dashboard_route'] ?? '') !== $sanitized_settings['dashboard_route'] ||
                    ($current_settings['enable_custom_urls'] ?? false) !== $sanitized_settings['enable_custom_urls']
                );
                
                update_option('site_dashboard_general_settings', $sanitized_settings);
                
                // Flush rewrite rules if routing changed
                if ($route_changed) {
                    add_option('site_dashboard_flush_rewrite_rules', true);
                }
                
                return rest_ensure_response([
                    'success' => true,
                    'message' => __('Settings saved successfully', 'site-dashboard'),
                    'data' => $sanitized_settings
                ]);
            }
        }
        
        return new WP_Error('invalid_request', __('Invalid request', 'site-dashboard'), ['status' => 400]);
    }
    
    /**
     * Sanitize custom SVG data
     */
    private function sanitize_custom_svgs($custom_svgs) {
        if (!is_array($custom_svgs)) {
            return [];
        }
        
        $sanitized = [];
        foreach ($custom_svgs as $key => $svg_data) {
            if (is_array($svg_data) && isset($svg_data['url']) && isset($svg_data['name'])) {
                $sanitized[sanitize_key($key)] = [
                    'url' => esc_url_raw($svg_data['url']),
                    'name' => sanitize_text_field($svg_data['name'])
                ];
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Handle menu items API requests
     */
    public function handle_menu_items($request) {
        if ($request->get_method() === 'GET') {
            return rest_ensure_response(get_option('site_dashboard_menu_items', []));
        }
        
        if ($request->get_method() === 'POST') {
            $items = $request->get_json_params();
            $sanitized_items = [];
            
            foreach ($items as $item) {
                if (isset($item['page_id']) && isset($item['title'])) {
                    $sanitized_items[] = [
                        'page_id' => intval($item['page_id']),
                        'title' => sanitize_text_field($item['title']),
                        'icon' => sanitize_text_field($item['icon'] ?? ''),
                        'order' => intval($item['order'] ?? 0),
                        'custom_route' => sanitize_title($item['custom_route'] ?? '')
                    ];
                }
            }
            
            update_option('site_dashboard_menu_items', $sanitized_items);
            return rest_ensure_response(['success' => true]);
        }
    }
    
    /**
     * Handle widgets API requests
     */
    public function handle_widgets($request) {
        if ($request->get_method() === 'GET') {
            return rest_ensure_response(get_option('site_dashboard_widgets', []));
        }
        
        if ($request->get_method() === 'POST') {
            $widget_data = $request->get_json_params();
            $widgets = get_option('site_dashboard_widgets', []);
            
            $widget = [
                'id' => uniqid(),
                'name' => sanitize_text_field($widget_data['name']),
                'description' => sanitize_textarea_field($widget_data['description'] ?? ''),
                'content' => wp_kses_post($widget_data['content']),
                'type' => sanitize_text_field($widget_data['type'] ?? 'pattern'),
                'created' => current_time('mysql')
            ];
            
            $widgets[] = $widget;
            update_option('site_dashboard_widgets', $widgets);
            
            return rest_ensure_response(['success' => true, 'widget' => $widget]);
        }
        
        if ($request->get_method() === 'DELETE') {
            $widget_id = $request->get_param('id');
            $widgets = get_option('site_dashboard_widgets', []);
            
            $widgets = array_filter($widgets, function($widget) use ($widget_id) {
                return $widget['id'] !== $widget_id;
            });
            
            update_option('site_dashboard_widgets', array_values($widgets));
            return rest_ensure_response(['success' => true]);
        }
    }
    
    /**
     * Get portal data for frontend
     */
    public function get_portal_data($request) {
        $menu_items = get_option('site_dashboard_menu_items', []);
        $general_settings = get_option('site_dashboard_general_settings', []);
        $widgets = get_option('site_dashboard_widgets', []);
        
        // Get page content for menu items
        foreach ($menu_items as &$item) {
            $page = get_post($item['page_id']);
            if ($page) {
                $item['content'] = apply_filters('the_content', $page->post_content);
                $item['excerpt'] = wp_trim_words($page->post_content, 20);
            }
        }
        
        return rest_ensure_response([
            'menu_items' => $menu_items,
            'settings' => $general_settings,
            'widgets' => $widgets
        ]);
    }
    
    /**
     * Add rewrite rules for frontend routing
     */
    public function add_rewrite_rules() {
        $settings = get_option('site_dashboard_general_settings', []);
        $portal_route = sanitize_title($settings['portal_route'] ?? 'portal');
        $dashboard_route = sanitize_title($settings['dashboard_route'] ?? 'dashboard');
        
        if (!empty($portal_route)) {
            // Main portal route
            add_rewrite_rule('^' . $portal_route . '/?$', 'index.php?portal_page=' . $dashboard_route, 'top');
            
            // Portal sub-pages
            add_rewrite_rule('^' . $portal_route . '/([^/]*)/?', 'index.php?portal_page=$matches[1]', 'top');
            
            // Store the current routes for comparison
            $current_routes = get_option('site_dashboard_current_routes', []);
            $new_routes = [
                'portal_route' => $portal_route,
                'dashboard_route' => $dashboard_route
            ];
            
            // If routes changed, mark for flush
            if ($current_routes !== $new_routes) {
                update_option('site_dashboard_current_routes', $new_routes);
                update_option('site_dashboard_flush_rewrite_rules', true);
            }
        }
    }
    
    /**
     * Flush rewrite rules if needed
     */
    public function maybe_flush_rewrite_rules() {
        if (get_option('site_dashboard_flush_rewrite_rules')) {
            flush_rewrite_rules();
            delete_option('site_dashboard_flush_rewrite_rules');
        }
    }
    
    /**
     * Handle frontend routes
     */
    public function handle_frontend_routes() {
        $portal_page = get_query_var('portal_page');
        if ($portal_page) {
            // Debug information (remove in production)
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('Portal route accessed: ' . $portal_page);
            }
            
            $this->render_frontend_dashboard_page();
            exit;
        }
    }
    
    /**
     * Render frontend dashboard page
     */
    public function render_frontend_dashboard_page() {
        // Completely isolated page - no theme interference
        $this->render_isolated_portal_page();
        exit;
    }
    
    /**
     * Render isolated portal page without theme interference
     */
    private function render_isolated_portal_page() {
        $settings = get_option('site_dashboard_general_settings', []);
        $portal_title = $settings['portal_title'] ?? 'Portal';
        $is_admin_logged_in = is_user_logged_in() && current_user_can('manage_options');
        
        // Enqueue assets
        $this->enqueue_frontend_assets();
        
        // Get all enqueued styles and scripts
        global $wp_styles, $wp_scripts;
        
        ?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($portal_title . ' | ' . get_bloginfo('name')); ?></title>
    
    <!-- Portal-specific styles -->
    <style>
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            overflow-x: hidden;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            background: <?php echo esc_attr($settings['portal_background'] ?? '#f0f0f1'); ?>;
            color: #1d2327;
            line-height: 1.4;
        }
        
        /* Admin bar adjustments */
        <?php if ($is_admin_logged_in): ?>
        body.admin-bar {
            padding-top: 32px; /* WordPress admin bar height */
        }
        
        @media screen and (max-width: 782px) {
            body.admin-bar {
                padding-top: 46px; /* Mobile admin bar height */
            }
        }
        
        #site-dashboard-root {
            min-height: calc(100vh - 32px);
        }
        
        @media screen and (max-width: 782px) {
            #site-dashboard-root {
                min-height: calc(100vh - 46px);
            }
        }
        <?php else: ?>
        #site-dashboard-root {
            min-height: 100vh;
        }
        <?php endif; ?>
        
        /* Portal container */
        #site-dashboard-root {
            display: flex;
            flex-direction: column;
            width: 100%;
            position: relative;
            background: inherit;
        }
        
        /* Loading state */
        .portal-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            flex-direction: column;
            gap: 16px;
        }
        
        .portal-loading .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid <?php echo esc_attr($settings['accent_color'] ?? '#2271b1'); ?>;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Ensure no theme interference */
        .portal-container * {
            font-family: inherit !important;
        }
        
        /* WordPress components fix */
        .components-modal__screen-overlay {
            z-index: 100001;
        }
        
        .components-modal__frame {
            z-index: 100002;
        }
        
        /* Print styles */
        @media print {
            body.admin-bar {
                padding-top: 0 !important;
            }
            
            #wpadminbar {
                display: none !important;
            }
        }
    </style>
    
    <?php 
    // Output WordPress head for scripts and styles
    wp_head(); 
    ?>
</head>
<body <?php body_class($is_admin_logged_in ? 'admin-bar' : ''); ?>>
    
    <!-- Portal loading indicator -->
    <div id="portal-loading" class="portal-loading">
        <div class="spinner"></div>
        <p>Loading Portal...</p>
    </div>
    
    <!-- Main portal container -->
    <div id="site-dashboard-root" class="portal-container" style="display: none;">
        <!-- Content will be rendered by React -->
    </div>
    
    <!-- SVG Icons -->
    <?php $this->render_svg_icons(); ?>
    
    <!-- Initialize portal after scripts load -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Hide loading, show portal
            var loading = document.getElementById('portal-loading');
            var portal = document.getElementById('site-dashboard-root');
            
            if (loading) loading.style.display = 'none';
            if (portal) portal.style.display = 'flex';
            
            // Prevent theme script interference
            window.portalIsolated = true;
        });
        
        // Enhanced error handling
        window.addEventListener('error', function(e) {
            console.error('Portal error:', e.error);
        });
        
        // Unhandled promise rejection handling
        window.addEventListener('unhandledrejection', function(e) {
            console.error('Portal promise rejection:', e.reason);
        });
    </script>
    
    <?php wp_footer(); ?>
</body>
</html><?php
    }
    
    /**
     * Render SVG icons inline
     */
    private function render_svg_icons() {
        echo '<svg style="display: none;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
                <symbol id="dashboard" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.333 10.833h5A.834.834 0 009.167 10V3.333a.833.833 0 00-.834-.833h-5a.833.833 0 00-.833.833V10a.833.833 0 00.833.833zM2.5 16.667a.833.833 0 00.833.833h5a.833.833 0 00.834-.833v-3.334a.833.833 0 00-.834-.833h-5a.833.833 0 00-.833.833v3.334zm8.333 0a.833.833 0 00.834.833h5a.833.833 0 00.833-.833v-5.834a.833.833 0 00-.833-.833h-5a.833.833 0 00-.834.833v5.834zm.834-8.334h5A.833.833 0 0017.5 7.5V3.333a.833.833 0 00-.833-.833h-5a.833.833 0 00-.834.833V7.5a.833.833 0 00.834.833z" />
                </symbol>
                
                <symbol id="shoppingCart" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path opacity=".4" d="M3.333 5.345L.631 2.643 1.81 1.464l2.702 2.703h12.701a.833.833 0 01.799 1.072l-2 6.667a.834.834 0 01-.799.594H5v1.667h9.167v1.666h-10A.833.833 0 013.333 15V5.345zm1.25 13.822a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
                </symbol>
                
                <symbol id="accountUsers" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.086 10.453a5.001 5.001 0 005.45-8.155 5 5 0 10-5.45 8.155z"/>
                    <path opacity=".4" d="M16.666 18.333H3.333v-1.666A4.167 4.167 0 017.5 12.5h5a4.167 4.167 0 014.166 4.167v1.666z"/>
                </symbol>
                
                <symbol id="pieChart" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.4" d="M9.16667 1.70834V10.8333H18.2917C17.8742 15.0442 14.3208 18.3333 10 18.3333C5.3975 18.3333 1.66667 14.6025 1.66667 10C1.66667 5.67917 4.95583 2.12584 9.16667 1.70834V1.70834ZM10.8333 1.70834C12.7458 1.901 14.533 2.74869 15.8921 4.10787C17.2513 5.46704 18.099 7.25418 18.2917 9.16667H10.8333V1.70834Z"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.8921 4.10787C14.533 2.74869 12.7458 1.901 10.8333 1.70834V9.16667H18.2917C18.099 7.25418 17.2513 5.46704 15.8921 4.10787Z"/>
                </symbol>
                
                <symbol id="settingsIcon" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.445 3.787a8.325 8.325 0 012.951-1.706 3.327 3.327 0 004.048.923c.45-.217.847-.532 1.159-.923a8.333 8.333 0 012.952 1.706 3.329 3.329 0 001.225 3.966c.413.282.884.467 1.379.542a8.369 8.369 0 010 3.408 3.33 3.33 0 00-2.824 3.044c-.038.499.037 1 .22 1.465a8.323 8.323 0 01-2.952 1.706A3.327 3.327 0 0010 16.666a3.328 3.328 0 00-2.604 1.251 8.325 8.325 0 01-2.951-1.706 3.328 3.328 0 00-1.226-3.965 3.326 3.326 0 00-1.379-.542 8.37 8.37 0 010-3.41 3.328 3.328 0 002.824-3.043 3.328 3.328 0 00-.22-1.464zm6.805 8.377a2.5 2.5 0 10-2.472-4.347 2.5 2.5 0 002.472 4.347z"/>
                </symbol>
                
                <symbol id="storeMng" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                    <path opacity=".4" d="M17.5 16.667a.833.833 0 01-.833.833H3.333a.833.833 0 01-.833-.833V7.908a.833.833 0 01.322-.658l6.666-5.185a.833.833 0 011.024 0l6.666 5.185a.832.832 0 01.322.658v8.759z" />
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.333 17.5H10V1.89a.833.833 0 00-.512.175L2.822 7.25a.833.833 0 00-.322.658v8.759a.833.833 0 00.833.833z"/>
                </symbol>
                
                <symbol id="searchIcon" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.167 1.667c4.14 0 7.5 3.36 7.5 7.5 0 4.14-3.36 7.5-7.5 7.5-4.14 0-7.5-3.36-7.5-7.5 0-4.14 3.36-7.5 7.5-7.5zm0 13.333A5.832 5.832 0 0015 9.167a5.832 5.832 0 00-5.833-5.834 5.831 5.831 0 00-5.833 5.834A5.832 5.832 0 009.167 15zm7.07.06l2.358 2.356-1.179 1.179-2.357-2.357 1.179-1.179z" fill="#000"/>
                </symbol>
                
                <symbol id="bellIcon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.667 14.1666H18.3337V15.8333H1.66699V14.1666H3.33366V8.33329C3.33366 6.56518 4.03604 4.86949 5.28628 3.61925C6.53652 2.36901 8.23222 1.66663 10.0003 1.66663C11.7684 1.66663 13.4641 2.36901 14.7144 3.61925C15.9646 4.86949 16.667 6.56518 16.667 8.33329V14.1666ZM7.50033 17.5H12.5003V19.1666H7.50033V17.5Z" fill="black"/>
                </symbol>
                
                <symbol id="themeIcon" width="18.16" height="18.16" viewBox="0 0 19 19" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.99993 9.82306C8.84656 8.66924 8.06108 7.19942 7.74276 5.59934C7.42444 3.99925 7.58756 2.34072 8.21152 0.833313C6.43251 1.18353 4.7984 2.05643 3.51818 3.3404C-0.0613997 6.91998 -0.0613997 12.7243 3.51818 16.3039C7.09868 19.8844 12.9021 19.8835 16.4826 16.3039C17.7662 15.0238 18.6391 13.3901 18.9897 11.6115C17.4823 12.2353 15.8238 12.3984 14.2237 12.0801C12.6236 11.7617 11.1538 10.9763 9.99993 9.82306Z"/>
                </symbol>
                
                <symbol id="sidebarToggle" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5 10.8325V16.6667C17.5 16.8877 17.421 17.0996 17.2803 17.2559C17.1397 17.4122 16.9489 17.5 16.75 17.5H10.75V10.8325H17.5ZM9.25 10.8325V17.5H3.25C3.05109 17.5 2.86032 17.4122 2.71967 17.2559C2.57902 17.0996 2.5 16.8877 2.5 16.6667V10.8325H9.25ZM9.25 2.5V9.16583H2.5V3.33333C2.5 3.11232 2.57902 2.90036 2.71967 2.74408C2.86032 2.5878 3.05109 2.5 3.25 2.5H9.25ZM16.75 2.5C16.9489 2.5 17.1397 2.5878 17.2803 2.74408C17.421 2.90036 17.5 3.11232 17.5 3.33333V9.16583H10.75V2.5H16.75Z" fill="black"/>
                </symbol>
                
                <symbol id="chevronUp" width="10" height="7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.22 6.03L5 2.81 1.78 6.03.72 4.97 5 .69l4.28 4.28-1.06 1.06z" fill="#B2B2B2"/>
                </symbol>
                
                <symbol id="triplePoint" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 2.25c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5zm0 10.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5-.675-1.5-1.5-1.5zM9 7.5c-.825 0-1.5.675-1.5 1.5s.675 1.5 1.5 1.5 1.5-.675 1.5-1.5S9.825 7.5 9 7.5z" />
                </symbol>
                
                <symbol id="accountsPreferences" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 11.667v1.666a5 5 0 00-5 5H3.333A6.667 6.667 0 0110 11.667zm0-.834c-2.763 0-5-2.237-5-5 0-2.762 2.237-5 5-5a5 5 0 015 5c0 2.763-2.238 5-5 5zm0-1.666A3.332 3.332 0 1010 2.5a3.332 3.332 0 100 6.667zm2.162 6.51a2.924 2.924 0 010-1.353l-.827-.477.834-1.444.826.478a2.914 2.914 0 011.171-.677v-.954h1.667v.954a2.91 2.91 0 011.17.677l.828-.478.833 1.444-.827.477c.106.445.106.908 0 1.352l.827.477-.834 1.444-.826-.478a2.913 2.913 0 01-1.171.677v.954h-1.667v-.954a2.914 2.914 0 01-1.17-.677l-.827.478-.834-1.444.827-.476zM15 16.25a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fill="#fff" opacity=".5"/>
                </symbol>
                
                <symbol id="logOut" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.333 15H5v1.667h10V3.333H5V5H3.333V2.5a.833.833 0 01.833-.833h11.667a.833.833 0 01.833.833v15a.833.833 0 01-.833.833H4.166a.833.833 0 01-.833-.833V15zM5 9.167h5.833v1.666H5v2.5L.833 10 5 6.667v2.5z" fill="#fff" opacity=".5"/>
                </symbol>
                
                <symbol id="message" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.303 12.667L1.333 15V2.667A.667.667 0 012 2h12a.667.667 0 01.666.667V12a.667.667 0 01-.666.667H4.303zm.363-6V8H6V6.667H4.666zm2.667 0V8h1.333V6.667H7.333zm2.667 0V8h1.333V6.667H10z" fill="#fff"/>
                </symbol>
                
                <symbol id="warningIcon" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 14.667A6.667 6.667 0 118 1.334a6.667 6.667 0 010 13.333zM7.333 10v1.333h1.333V10H7.333zm0-5.333v4h1.333v-4H7.333z" fill="#fff"/>
                </symbol>
                
                <symbol id="whiteCheck" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.666 10.115l6.128-6.129.944.943L6.666 12 2.424 7.757l.942-.942 3.3 3.3z" fill="#fff"/>
                </symbol>
            </defs>
        </svg>';
    }
    
    /**
     * Add query vars
     */
    public function add_query_vars($vars) {
        $vars[] = 'portal_page';
        return $vars;
    }
    
    /**
     * Plugin activation
     */
    public function activate_plugin() {
        // Add rewrite rules
        $this->add_rewrite_rules();
        
        // Flush rewrite rules
        flush_rewrite_rules();
        
        // Set default settings if they don't exist
        $default_settings = [
            'portal_title' => 'Portal',
            'show_user_menu' => true,
            'portal_background' => '#f0f0f1',
            'sidebar_background' => '#ffffff',
            'accent_color' => '#2271b1',
            'portal_route' => 'portal',
            'dashboard_route' => 'dashboard',
            'enable_custom_urls' => false,
            'show_search' => true,
            'show_notifications' => true,
            'enable_dark_mode' => true
        ];
        
        if (!get_option('site_dashboard_general_settings')) {
            update_option('site_dashboard_general_settings', $default_settings);
        }
        
        // Create default portal pages
        $this->create_default_portal_pages();
    }
    
    /**
     * Create default portal pages
     */
    private function create_default_portal_pages() {
        // Check if any portal pages already exist
        $existing_pages = get_posts([
            'post_type' => 'portal_page',
            'post_status' => 'any',
            'numberposts' => 1
        ]);
        
        if (!empty($existing_pages)) {
            return; // Pages already exist
        }
        
        // Create default pages
        $default_pages = [
            [
                'title' => 'Dashboard',
                'content' => '<h2>Welcome to your Portal Dashboard</h2><p>This is your main dashboard page. You can customize this content by editing this portal page.</p><p>Use the sidebar navigation to access different sections of your portal.</p>',
                'menu_order' => 1
            ],
            [
                'title' => 'Getting Started',
                'content' => '<h2>Getting Started</h2><p>Welcome to your new portal! Here are some things you can do:</p><ul><li>Customize your portal settings in the admin area</li><li>Create new portal pages for your content</li><li>Configure the navigation menu</li><li>Add widgets to the sidebar</li></ul>',
                'menu_order' => 2
            ],
            [
                'title' => 'Settings',
                'content' => '<h2>Portal Settings</h2><p>This page can contain settings and configuration options for your portal users.</p>',
                'menu_order' => 3
            ]
        ];
        
        foreach ($default_pages as $page_data) {
            wp_insert_post([
                'post_title' => $page_data['title'],
                'post_content' => $page_data['content'],
                'post_status' => 'publish',
                'post_type' => 'portal_page',
                'menu_order' => $page_data['menu_order'],
                'post_author' => 1 // Admin user
            ]);
        }
        
        // Create default menu items
        $portal_pages = get_posts([
            'post_type' => 'portal_page',
            'post_status' => 'publish',
            'numberposts' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC'
        ]);
        
        $menu_items = [];
        $icons = ['dashboard', 'admin-home', 'admin-settings'];
        
        foreach ($portal_pages as $index => $page) {
            $menu_items[] = [
                'page_id' => $page->ID,
                'title' => $page->post_title,
                'icon' => $icons[$index] ?? 'admin-page',
                'order' => $index,
                'custom_route' => ''
            ];
        }
        
        update_option('site_dashboard_menu_items', $menu_items);
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate_plugin() {
        // Remove rewrite rules
        flush_rewrite_rules();
        
        // Clean up options
        delete_option('site_dashboard_current_routes');
        delete_option('site_dashboard_flush_rewrite_rules');
    }
    
    /**
     * Register custom post types for portal content
     */
    public function register_custom_post_types() {
        // Portal Pages post type
        register_post_type('portal_page', [
            'labels' => [
                'name' => __('Portal Pages', 'site-dashboard'),
                'singular_name' => __('Portal Page', 'site-dashboard'),
                'menu_name' => __('Portal Pages', 'site-dashboard'),
                'add_new' => __('Add New', 'site-dashboard'),
                'add_new_item' => __('Add New Portal Page', 'site-dashboard'),
                'edit_item' => __('Edit Portal Page', 'site-dashboard'),
                'new_item' => __('New Portal Page', 'site-dashboard'),
                'view_item' => __('View Portal Page', 'site-dashboard'),
                'search_items' => __('Search Portal Pages', 'site-dashboard'),
                'not_found' => __('No portal pages found', 'site-dashboard'),
                'not_found_in_trash' => __('No portal pages found in trash', 'site-dashboard'),
                'all_items' => __('All Portal Pages', 'site-dashboard'),
                'archives' => __('Portal Page Archives', 'site-dashboard'),
                'insert_into_item' => __('Insert into portal page', 'site-dashboard'),
                'uploaded_to_this_item' => __('Uploaded to this portal page', 'site-dashboard'),
            ],
            'public' => false,
            'publicly_queryable' => false,
            'show_ui' => true,
            'show_in_menu' => 'site-dashboard',
            'show_in_admin_bar' => false,
            'show_in_nav_menus' => false,
            'show_in_rest' => true,
            'rest_base' => 'portal-pages',
            'rest_controller_class' => 'WP_REST_Posts_Controller',
            'capability_type' => 'page',
            'map_meta_cap' => true,
            'capabilities' => [
                'edit_post' => 'manage_options',
                'read_post' => 'manage_options',
                'delete_post' => 'manage_options',
                'edit_posts' => 'manage_options',
                'edit_others_posts' => 'manage_options',
                'publish_posts' => 'manage_options',
                'read_private_posts' => 'manage_options',
                'delete_posts' => 'manage_options',
                'delete_private_posts' => 'manage_options',
                'delete_published_posts' => 'manage_options',
                'delete_others_posts' => 'manage_options',
                'edit_private_posts' => 'manage_options',
                'edit_published_posts' => 'manage_options',
            ],
            'hierarchical' => true,
            'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields', 'revisions'],
            'has_archive' => false,
            'rewrite' => false,
            'menu_icon' => 'dashicons-admin-page',
            'description' => __('Content pages for the portal interface', 'site-dashboard'),
            'delete_with_user' => false,
        ]);
    }
}

// Initialize the plugin
new SiteDashboardPlugin(); 