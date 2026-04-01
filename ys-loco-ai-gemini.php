<?php
/**
 * Plugin Name: YS Loco AI Translate via Gemini
 * Plugin URI: https://yangsheep.com.tw
 * Description: An add-on for Loco Translate to provide automatic translations using Google Gemini API.
 * Version:           1.2.7
 * Author: Yangsheep
 * Author URI: https://yangsheep.com.tw
 * Text Domain: ys-loco-ai-gemini
 * Domain Path: /languages
 * Requires Plugins: loco-translate
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'YS_LOCO_GEMINI_VERSION', '1.2.7' );
define( 'YS_LOCO_GEMINI_PATH', plugin_dir_path( __FILE__ ) );
define( 'YS_LOCO_GEMINI_URL', plugin_dir_url( __FILE__ ) );

// Composer autoloader（載入 hub-client 等 vendor 套件）
if ( file_exists( YS_LOCO_GEMINI_PATH . 'vendor/autoload.php' ) ) {
	require_once YS_LOCO_GEMINI_PATH . 'vendor/autoload.php';
}

// YS Plugin Hub Client 註冊
add_action( 'plugins_loaded', function () {
	if ( class_exists( '\YangSheep\PluginHubClient\YSPluginHubClient' ) ) {
		\YangSheep\PluginHubClient\YSPluginHubClient::register( array(
			'slug'        => 'ys-loco-ai-gemini',
			'version'     => YS_LOCO_GEMINI_VERSION,
			'plugin_file' => __FILE__,
			'name'        => 'YS Loco AI Translate via Gemini',
		) );
	}
}, 5 );

/**
 * Main Class
 */
final class YS_Loco_AI_Gemini {
	private static $instance = null;

	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		$this->includes();
		$this->init_hooks();
	}

	private function includes() {
		require_once YS_LOCO_GEMINI_PATH . 'includes/class-ys-gemini-settings.php';
		require_once YS_LOCO_GEMINI_PATH . 'includes/class-ys-gemini-api.php';
		require_once YS_LOCO_GEMINI_PATH . 'includes/class-ys-loco-integration.php';
	}

	private function init_hooks() {
		// Load text domain
		add_action( 'init', array( $this, 'load_textdomain' ) );

		// Initialize settings
		YS_Gemini_Settings::init();

		// Initialize Loco Integration
		YS_Loco_Integration::init();
	}

	public function load_textdomain() {
		load_plugin_textdomain( 'ys-loco-ai-gemini', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}
}

function YS_Loco_AI_Gemini() {
	return YS_Loco_AI_Gemini::get_instance();
}

// Start the plugin
add_action( 'plugins_loaded', 'YS_Loco_AI_Gemini' );
