<?php
/**
 * Plugin Name: Site Dashboard
 * Description: A modern admin dashboard built with @automattic/site-admin
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
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_shortcode('site_dashboard', [$this, 'render_frontend_dashboard']);
        add_action('template_redirect', [$this, 'add_frontend_route']);
    }
    
    /**
     * Load plugin text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'site-dashboard',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }
    
    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Portal', 'site-dashboard'),
            __('Portal', 'site-dashboard'),
            'manage_options',
            'site-dashboard',
            [$this, 'render_admin_page'],
            'dashicons-dashboard',
            2
        );
        add_submenu_page(
            'site-dashboard',
            __('Settings', 'site-dashboard'),
            __('Settings', 'site-dashboard'),
            'manage_options',
            'site-dashboard-settings',
            [$this, 'render_settings_page']
        );
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our admin pages
        if (strpos($hook, 'site-dashboard') === false) {
            return;
        }
        
        $asset_file = include(plugin_dir_path(__FILE__) . 'build/index.asset.php');
        
        // Enqueue the built JavaScript file
        wp_enqueue_script(
            'site-dashboard-js',
            plugin_dir_url(__FILE__) . 'build/index.js',
            array_merge(['wp-element', 'wp-components', 'wp-i18n', 'wp-api-fetch', 'wp-data'], $asset_file['dependencies']),
            $asset_file['version'],
            true
        );
        
        // Enqueue styles
        wp_enqueue_style(
            'site-dashboard-css',
            plugin_dir_url(__FILE__) . 'build/style-index.css',
            ['wp-components'],
            $asset_file['version']
        );
        
        // Localize script with WordPress data
        wp_localize_script(
            'site-dashboard-js',
            'siteDashboardData',
            [
                'apiUrl' => rest_url('wp/v2/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'currentUser' => get_current_user_id(),
                'adminUrl' => admin_url(),
                'pluginUrl' => plugin_dir_url(__FILE__),
                'isAdmin' => true,
                'settingsPage' => isset($_GET['page']) && $_GET['page'] === 'site-dashboard-settings',
            ]
        );
        
        // Set up translations for JavaScript
        wp_set_script_translations(
            'site-dashboard-js',
            'site-dashboard',
            plugin_dir_path(__FILE__) . 'languages'
        );
    }

    /**
     * Enqueue assets for settings page
     */
    public function enqueue_settings_assets() {
        wp_enqueue_script(
            'site-dashboard-settings',
            plugin_dir_url(__FILE__) . 'build/settings.js',
            ['wp-element', 'wp-data', 'wp-components', 'wp-api-fetch'],
            filemtime(plugin_dir_path(__FILE__) . 'build/settings.js'),
            true
        );
        
        wp_enqueue_style(
            'site-dashboard-settings-style',
            plugin_dir_url(__FILE__) . 'build/settings.css',
            [],
            filemtime(plugin_dir_path(__FILE__) . 'build/settings.css')
        );
        
        wp_localize_script(
            'site-dashboard-settings',
            'siteDashboardSettings',
            [
                'apiUrl' => rest_url('site-dashboard/v1/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'pluginUrl' => plugin_dir_url(__FILE__),
                'isAdmin' => true
            ]
        );
    }
    
    /**
     * Enqueue assets for frontend dashboard
     */
    public function enqueue_frontend_assets() {
        $asset_file = include(plugin_dir_path(__FILE__) . 'build/index.asset.php');
        
        wp_enqueue_script(
            'site-dashboard',
            plugin_dir_url(__FILE__) . 'build/index.js',
            array_merge(['wp-element', 'wp-components', 'wp-i18n', 'wp-api-fetch', 'wp-data'], $asset_file['dependencies']),
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
        
        wp_set_script_translations(
            'site-dashboard',
            'site-dashboard',
            plugin_dir_path(__FILE__) . 'languages'
        );
    }
    
    /**
     * Render the admin page (dashboard/reports)
     */
    public function render_admin_page() {
        echo '<div id="site-dashboard-root" class="wrap"></div>';
    }

    /**
     * Render the settings page
     */
    public function render_settings_page() {
        echo '<div id="site-dashboard-settings-root" class="wrap"></div>';
    }

    /**
     * Render the frontend dashboard
     */
    public function render_frontend_dashboard($atts) {
        if (!is_user_logged_in()) {
            return '<p>' . __('Please log in to view the dashboard.', 'site-dashboard') . '</p>';
        }
        
        // Enqueue frontend assets
        $this->enqueue_frontend_assets();
        
        return '<div id="site-dashboard-root"></div>';
    }
    
    /**
     * Register REST API endpoints
     */
    public function register_rest_routes() {
        register_rest_route('site-dashboard/v1', '/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_dashboard_stats'],
            'permission_callback' => function() {
                return is_user_logged_in();
            }
        ]);
        
        register_rest_route('site-dashboard/v1', '/roles', [
            'methods' => 'GET',
            'callback' => [$this, 'get_user_roles'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        register_rest_route('site-dashboard/v1', '/settings', [
            'methods' => ['GET', 'POST'],
            'callback' => [$this, 'handle_settings'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
    }
    
    /**
     * Get dashboard statistics
     */
    public function get_dashboard_stats($request) {
        return rest_ensure_response([
            'posts_count' => wp_count_posts()->publish,
            'pages_count' => wp_count_posts('page')->publish,
            'users_count' => count_users()['total_users'],
            'comments_count' => wp_count_comments()->approved,
        ]);
    }
    
    /**
     * Get user roles
     */
    public function get_user_roles($request) {
        if (!function_exists('get_editable_roles')) {
            require_once(ABSPATH . 'wp-admin/includes/user.php');
        }
        
        $wp_roles = get_editable_roles();
        $roles = [];
        
        foreach ($wp_roles as $slug => $role) {
            $roles[] = [
                'slug' => $slug,
                'name' => $role['name']
            ];
        }
        
        return rest_ensure_response($roles);
    }
    
    /**
     * Handle settings get/post
     */
    public function handle_settings($request) {
        try {
            if ($request->get_method() === 'GET') {
                $settings = get_option('site_dashboard_settings', [
                    'assignedPages' => [],
                    'dashboardRoute' => '/dashboard',
                    'allowedRoles' => ['administrator'],
                    'loginLogo' => '',
                    'loginBgColor' => '#ffffff',
                    'loginAccentColor' => '#2271b1',
                    'loginTagline' => '',
                    'loginBgImage' => '',
                ]);
                return rest_ensure_response($settings);
            }
            
            if ($request->get_method() === 'POST') {
                $data = $request->get_json_params();
                if ($data && is_array($data)) {
                    update_option('site_dashboard_settings', $data);
                    return rest_ensure_response(['success' => true]);
                } else {
                    return new WP_Error('invalid_data', 'Invalid data provided', ['status' => 400]);
                }
            }
        } catch (Exception $e) {
            return new WP_Error('server_error', $e->getMessage(), ['status' => 500]);
        }
        
        return new WP_Error('method_not_allowed', 'Method not allowed', ['status' => 405]);
    }
    
    /**
     * Add frontend route for dashboard
     */
    public function add_frontend_route() {
        $settings = get_option('site_dashboard_settings', ['dashboardRoute' => '/dashboard']);
        $route = $settings['dashboardRoute'] ?? '/dashboard';
        
        // Simple route handling - check if current URL matches dashboard route
        if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], $route) !== false) {
            // Check if user is logged in and has permission
            if (!is_user_logged_in()) {
                wp_redirect(wp_login_url(home_url($route)));
                exit;
            }
            
            // Check user role permissions
            $allowed_roles = $settings['allowedRoles'] ?? ['administrator'];
            $current_user = wp_get_current_user();
            $user_roles = $current_user->roles;
            
            if (!array_intersect($allowed_roles, $user_roles)) {
                wp_die(__('You do not have permission to access this dashboard.', 'site-dashboard'));
            }
            
            // Load dashboard template
            $this->render_frontend_dashboard_page();
            exit;
        }
    }
    
    /**
     * Render frontend dashboard page
     */
    public function render_frontend_dashboard_page() {
        // Enqueue assets
        $this->enqueue_frontend_assets();
        
        // Basic HTML template
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo( 'charset' ); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title><?php echo esc_html(__('Portal Dashboard', 'site-dashboard')); ?></title>
            <?php wp_head(); ?>
        </head>
        <body class="portal-dashboard-frontend">
            <div id="site-dashboard-root"></div>
            <?php wp_footer(); ?>
        </body>
        </html>
        <?php
    }
}

// Initialize the plugin
new SiteDashboardPlugin();

// Activation hook
register_activation_hook(__FILE__, function() {
    // Create any necessary database tables or options
    add_option('site_dashboard_version', '1.0.0');
});

// Deactivation hook
register_deactivation_hook(__FILE__, function() {
    // Clean up if necessary
}); 