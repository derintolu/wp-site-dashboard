# Portal Routing Configuration

## Overview

The Site Dashboard plugin now supports configurable routing for the frontend portal. You can customize the URL structure and create a seamless portal experience.

## Setting Up Routing

### 1. Admin Configuration

1. Go to **Portal** in your WordPress admin
2. Navigate to **Settings**
3. Configure the routing options:
   - **Portal Base Route**: The main URL path (default: "portal")
   - **Dashboard Page Route**: The default page route (default: "dashboard") 
   - **Enable Custom URLs**: Allow custom routes for each menu item

### 2. URL Structure

With default settings, your portal will be accessible at:
- Main Portal: `/portal` (redirects to dashboard)
- Dashboard: `/portal/dashboard`
- Menu Pages: `/portal/[page-route]`

### 3. Custom Menu Routes

When "Enable Custom URLs" is enabled:
1. Go to **Portal > Navigation**
2. For each menu item, you can set a **Custom Route**
3. Example: Setting "my-services" creates `/portal/my-services`

## Troubleshooting

### Routes Not Working

If your portal routes return 404 errors:

1. **Flush Permalinks**:
   - Go to **Settings > Permalinks**
   - Click "Save Changes" (this flushes rewrite rules)

2. **Check Permalink Structure**:
   - Ensure your site uses "Pretty Permalinks"
   - Go to **Settings > Permalinks**
   - Select any option except "Plain"

3. **Plugin Activation**:
   - Deactivate and reactivate the plugin
   - This will reset the rewrite rules

### Debug Mode

Enable WordPress debug mode to see routing logs:

```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check `/wp-content/debug.log` for portal routing messages.

## Technical Details

### Rewrite Rules

The plugin creates these rewrite rules:
- `^portal/?$` → `index.php?portal_page=dashboard`
- `^portal/([^/]*)/?` → `index.php?portal_page=$matches[1]`

### Query Variables

- `portal_page`: Contains the requested portal page

### Hooks Used

- `init`: Add rewrite rules
- `wp_loaded`: Flush rewrite rules if needed
- `template_redirect`: Handle portal routes
- `query_vars`: Register portal query variables

## Examples

### Basic Setup
```
Portal Base Route: "portal"
Dashboard Route: "dashboard"
URLs: /portal, /portal/dashboard, /portal/about
```

### Custom Setup
```
Portal Base Route: "dashboard"
Dashboard Route: "home"
URLs: /dashboard, /dashboard/home, /dashboard/services
```

### Subdirectory Setup
```
Portal Base Route: "client/portal"
Dashboard Route: "overview"
URLs: /client/portal, /client/portal/overview
``` 