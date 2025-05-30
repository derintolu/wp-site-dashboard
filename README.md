# WP Site Dashboard

A WordPress plugin that provides a configurable frontend portal dashboard with a backend settings interface built using WordPress Gutenberg components.

## Features

- 🎯 **Frontend Portal Dashboard**: Custom dashboard accessible at a configurable route (e.g., `/portal`)
- ⚙️ **Backend Settings Page**: Full-page Gutenberg-like interface for configuration
- 🔐 **Role-based Access Control**: Configure which user roles can access the portal
- 🎨 **Login Page Customization**: Custom logo, colors, tagline, and background for login pages
- 📄 **Page Assignment**: Assign specific WordPress pages to portal sections
- 📊 **Dashboard Statistics**: Display posts, pages, users, and comments counts
- 🚀 **Quick Actions**: Easy access to common WordPress tasks
- 📱 **Responsive Design**: Mobile-friendly interface

## Tech Stack

- **WordPress Plugin Framework**
- **React** with `@wordpress/element`
- **WordPress Components** (`@wordpress/components`)
- **Some @automattic/site-admin components** for enhanced UI
- **SCSS** for styling
- **WordPress REST API** for data handling
- **Webpack** via `@wordpress/scripts` for building

## Installation

1. Clone this repository to your WordPress plugins directory:
   ```bash
   git clone https://github.com/yourusername/wp-site-dashboard.git /path/to/wordpress/wp-content/plugins/wp-site-dashboard
   ```

2. Navigate to the plugin directory:
   ```bash
   cd /path/to/wordpress/wp-content/plugins/wp-site-dashboard
   ```

3. Install dependencies:
   ```bash
   yarn install
   ```

4. Build the plugin:
   ```bash
   yarn build
   ```

5. Activate the plugin in your WordPress admin dashboard.

## Development

### Prerequisites

- Node.js (v14 or higher)
- Yarn
- WordPress development environment

### Setup

1. Clone the repository
2. Install dependencies: `yarn install`
3. Start development mode: `yarn start`
4. Build for production: `yarn build`

### Available Scripts

- `yarn start` - Start development mode with hot reloading
- `yarn build` - Build for production
- `yarn packages-update` - Update WordPress packages

### File Structure

```
wp-site-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx      # Frontend portal dashboard
│   │   └── Settings.jsx       # Backend settings interface
│   ├── index.js               # Main entry point
│   └── style.scss            # Global styles
├── build/                     # Compiled assets
├── wp-site-dashboard.php      # Main plugin file
├── package.json
├── webpack.config.js
└── README.md
```

## Usage

### Backend Configuration

1. Go to **Portal > Settings** in your WordPress admin
2. Configure:
   - **General Settings**: Dashboard route and allowed user roles
   - **Login Page Appearance**: Logo, colors, tagline, background
   - **Page Assignment**: Assign WordPress pages to portal sections

### Frontend Portal

- Access the portal at your configured route (default: `/portal`)
- View site statistics and quick actions
- Navigate through assigned pages

## API Endpoints

The plugin registers the following REST API endpoints:

- `GET /wp-json/site-dashboard/v1/stats` - Get site statistics
- `GET /wp-json/site-dashboard/v1/roles` - Get available user roles
- `GET /wp-json/site-dashboard/v1/settings` - Get plugin settings
- `POST /wp-json/site-dashboard/v1/settings` - Update plugin settings

## Customization

### Styling

The plugin uses SCSS for styling. Main style file: `src/style.scss`

Key CSS classes:
- `.portal-dashboard-app` - Main dashboard container
- `.portal-sidebar` - Sidebar navigation
- `.portal-main-content` - Main content area
- `.portal-stats-grid` - Statistics cards grid

### Adding New Features

1. Create new React components in `src/components/`
2. Add new API endpoints in `wp-site-dashboard.php`
3. Update styles in `src/style.scss`
4. Build the plugin: `yarn build`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Build and test: `yarn build`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## License

This project is licensed under the GPL v2 or later - see the plugin header for details.

## Changelog

### v1.0.0
- Initial release
- Frontend portal dashboard
- Backend settings interface
- Role-based access control
- Login page customization
- Statistics and quick actions

## Support

For support, please create an issue on the GitHub repository. 