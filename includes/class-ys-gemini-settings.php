<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class YS_Gemini_Settings {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_admin_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function add_admin_menu() {
		add_submenu_page(
			'options-general.php',
			'YS Loco AI Gemini',
			'YS Loco AI Gemini',
			'manage_options',
			'ys-loco-ai-gemini',
			array( __CLASS__, 'render_settings_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'ys_loco_gemini_options', 'ys_loco_gemini_api_key' );
		register_setting( 'ys_loco_gemini_options', 'ys_loco_gemini_model' );
		register_setting( 'ys_loco_gemini_options', 'ys_loco_gemini_prompt' );
	}

	public static function render_settings_page() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'YS Loco AI Translate via Gemini Settings', 'ys-loco-ai-gemini' ); ?></h1>
			<form method="post" action="options.php">
				<?php settings_fields( 'ys_loco_gemini_options' ); ?>
				<?php do_settings_sections( 'ys_loco_gemini_options' ); ?>
				<table class="form-table">
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Gemini API Key', 'ys-loco-ai-gemini' ); ?></th>
						<td>
							<input type="password" name="ys_loco_gemini_api_key" value="<?php echo esc_attr( get_option( 'ys_loco_gemini_api_key' ) ); ?>" class="large-text" />
						</td>
					</tr>
					<tr valign="top">
						<th scope="row"><?php esc_html_e( 'Gemini Model', 'ys-loco-ai-gemini' ); ?></th>
						<td>
							<input type="text" name="ys_loco_gemini_model" value="<?php echo esc_attr( get_option( 'ys_loco_gemini_model', 'gemini-1.5-flash' ) ); ?>" class="large-text" />
							<p class="description">
                                <?php printf( 
                                    /* translators: %s: URL to Gemini models */
                                    esc_html__( 'Default: gemini-1.5-flash. See available models at %s', 'ys-loco-ai-gemini' ), 
                                    '<a href="https://ai.google.dev/gemini-api/docs/models?hl=zh-tw#gemini-3-pro-image-preview" target="_blank">Google AI for Developers</a>'
                                ); ?>
                            </p>
						</td>
					</tr>
                    <tr valign="top">
						<th scope="row"><?php esc_html_e( 'Custom Prompt Template', 'ys-loco-ai-gemini' ); ?></th>
						<td>
							<?php 
                            $default_prompt = "You are a %language% translator. Please translate the WordPress Plugin strings. As this is a plugin translation, you must preserve dynamic placeholders such as %s, %%, etc. Translate: %source%";
                            ?>
                            <textarea name="ys_loco_gemini_prompt" class="large-text" rows="5"><?php echo esc_textarea( get_option( 'ys_loco_gemini_prompt', $default_prompt ) ); ?></textarea>
							<p class="description"><?php esc_html_e( 'Use %language% for target language and %source% for source text/JSON items.', 'ys-loco-ai-gemini' ); ?></p>
						</td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}
