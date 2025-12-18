<?php
/**
 * Plugin Name:       BCST XYFlow
 * Plugin URI:        https://github.com/s0985514623/bcst-xyflow
 * Description:       BCST XYFlow is a plugin for creating a WordPress plugin with React, Tailwind, TypeScript, React Query v4, SCSS and Vite.
 * Version:           1.0.9
 * Requires at least: 5.7
 * Requires PHP:      8.0
 * Author:            Ren
 * Author URI:        https://github.com/s0985514623
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       bcst-xyflow
 * Domain Path:       /languages
 * Tags: vite, react, tailwind, typescript, react-query, scss, WordPress, WordPress plugin
 */

declare ( strict_types=1 );

namespace J7\WpReactPlugin;

if ( ! \class_exists( 'J7\WpReactPlugin\Plugin' ) ) {
	require_once __DIR__ . '/vendor-prefixed/autoload.php';
	require_once __DIR__ . '/vendor/autoload.php';

	/**
	 * Class Plugin
	 */
	final class Plugin {
		use \J7WpReactPlugin\vendor\J7\WpUtils\Traits\PluginTrait;
		use \J7WpReactPlugin\vendor\J7\WpUtils\Traits\SingletonTrait;

		/**
		 * Constructor
		 */
		public function __construct() {

			// $this->required_plugins = array(
			// array(
			// 'name'     => 'WooCommerce',
			// 'slug'     => 'woocommerce',
			// 'required' => true,
			// 'version'  => '7.6.0',
			// ),
			// array(
			// 'name'     => 'WP Toolkit',
			// 'slug'     => 'wp-toolkit',
			// 'source'   => 'Author URL/wp-toolkit/releases/latest/download/wp-toolkit.zip',
			// 'required' => true,
			// ),
			// );

			$this->init(
				[
					'app_name'    => 'BCST XYFlow',
					'github_repo' => 'https://github.com/s0985514623/bcst-xyflow',
					'callback'    => [ Bootstrap::class, 'instance' ],
				]
			);
		}
	}
}

Plugin::instance();
