<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class YS_Loco_Integration {

	public static function init() {
		// Register API provider
		add_filter( 'loco_api_providers', array( __CLASS__, 'register_provider' ) );
        
        // Initialize AJAX handler
        add_action( 'loco_api_ajax', array( __CLASS__, 'init_ajax' ) );

        // Enqueue Editor Scripts
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_editor_scripts' ) );
        
        // Inject Interceptor Early
        add_action( 'admin_print_footer_scripts', array( __CLASS__, 'print_interceptor_scripts' ), 0 );
	}

    public static function print_interceptor_scripts() {
        if ( isset($_GET['page']) &&  strpos($_GET['page'], 'loco') !== false ) {
            // We print raw JS content or include the file content to ensure it runs immediately 
            // and before other enqueued scripts in the footer.
            $file_path = YS_LOCO_GEMINI_PATH . 'assets/js/ys-gemini-interceptor.js';
            if ( file_exists( $file_path ) ) {
                echo '<script type="text/javascript">';
                include $file_path;
                echo '</script>';
            }
        }
    }

    public static function enqueue_editor_scripts( $hook ) {
        // Only load on Loco Translate pages
        if ( isset($_GET['page']) &&  strpos($_GET['page'], 'loco') !== false ) {
             wp_enqueue_script( 
                 'ys-gemini-editor', 
                 YS_LOCO_GEMINI_URL . 'assets/js/ys-gemini-editor.js', 
                 array('jquery'), 
                 '2.3.0', 
                 true 
             );
             
             // Pass PHP data and i18n strings to JS
             $prompt_template = get_option( 'ys_loco_gemini_prompt', "You are a %language% translator. Please translate..." );
             wp_localize_script( 'ys-gemini-editor', 'ysLocoSettings', array(
                 'prompt' => $prompt_template,
                 'is_admin' => current_user_can('manage_options'),
                 // i18n strings for UI
                 'i18n' => array(
                     // Modal title
                     'modal_title' => __( 'YS AI 翻譯工具', 'ys-loco-ai-gemini' ),
                     // Tab labels
                     'export_json' => __( '匯出 JSON', 'ys-loco-ai-gemini' ),
                     'import_json' => __( '匯入 JSON', 'ys-loco-ai-gemini' ),
                     // Export tab
                     'export_untranslated_only' => __( '僅匯出未翻譯的字串', 'ys-loco-ai-gemini' ),
                     'export_description' => __( '下載適合 AI 翻譯的 JSON 檔案。', 'ys-loco-ai-gemini' ),
                     'export_format' => __( '格式：{"原文": "譯文"}（複數形式可以是陣列）', 'ys-loco-ai-gemini' ),
                     'download_json' => __( '下載 JSON', 'ys-loco-ai-gemini' ),
                     // Import tab
                     'upload_file' => __( '上傳檔案', 'ys-loco-ai-gemini' ),
                     'paste_json' => __( '貼上 JSON', 'ys-loco-ai-gemini' ),
                     'drop_file_here' => __( '拖曳 JSON 檔案到此處或點擊選擇', 'ys-loco-ai-gemini' ),
                     'paste_placeholder' => __( '在此貼上您的 JSON 翻譯內容...', 'ys-loco-ai-gemini' ),
                     'overwrite_existing' => __( '覆寫現有譯文', 'ys-loco-ai-gemini' ),
                     'fuzzy_matching' => __( '啟用模糊匹配', 'ys-loco-ai-gemini' ),
                     'fuzzy_description' => __( '忽略大小寫和標點符號的差異', 'ys-loco-ai-gemini' ),
                     'import_btn' => __( '匯入翻譯', 'ys-loco-ai-gemini' ),
                     // Messages
                     'import_success' => __( '已匯入 %d 筆翻譯。請記得儲存！', 'ys-loco-ai-gemini' ),
                     'import_error' => __( '匯入失敗：', 'ys-loco-ai-gemini' ),
                     'no_file_selected' => __( '請選擇檔案', 'ys-loco-ai-gemini' ),
                     'invalid_json' => __( 'JSON 格式無效', 'ys-loco-ai-gemini' ),
                     'processing' => __( '處理中...', 'ys-loco-ai-gemini' ),
                     // Button labels
                     'tools_btn' => __( '工具', 'ys-loco-ai-gemini' ),
                     'ai_translate_btn' => __( 'AI 翻譯', 'ys-loco-ai-gemini' ),
                 ),
             ));
             
             wp_enqueue_style(
                 'ys-gemini-style',
                 YS_LOCO_GEMINI_URL . 'assets/css/ys-gemini-style.css',
                 array(),
                 '1.0.5'
             );
        }
    }

	public static function register_provider( $apis ) {
		// Gemini Provider
        $apis[] = array(
			'id'   => 'gemini_ai',
			'name' => 'Gemini AI',
			'url'  => 'https://yangsheep.com', // Info URL
            'key'  => 'gemini', // Internal key
		);
		return $apis;
	}
    
    public static function init_ajax() {
        // Hook into specific translate action for our provider
        add_filter( 'loco_api_translate_gemini_ai', array( __CLASS__, 'process_batch' ), 10, 3 );
    }

    /**
     * @param array $targets  Storage for results
     * @param array $sources  Source strings
     * @param Loco_Locale $locale Target locale
     */
	public static function process_batch( array $targets, array $sources, $locale ) {
        
        // Check if Loco provided a key (per-project override)
        // The args passed to this filter are actually: ( array $targets, array $sources, Loco_Locale $locale, array $config )
        // Reference: apply_filters( 'loco_api_translate_'.$id, $results, $sources, $locale, $conf );
        // We need to capture the 4th argument!
        $config = func_num_args() > 3 ? func_get_arg(3) : array();
        
        $api_key = null;
        if ( !empty($config['key']) ) {
            $api_key = $config['key'];
        }

        $api = new YS_Gemini_API();
        if ($api_key) {
            $api->set_api_key( $api_key ); // We need to add this method to API class
        }
        
        // Convert sources to associative array for JSON context (using index as key)
        $batch_data = [];
        foreach ( $sources as $index => $source ) {
            // Loco passes simple array of strings if we look at reference, 
            // but let's check the reference implementation details.
            // Reference: 'loco_api_translate_loco_auto' receives ( array $targets, array $items, Loco_Locale $locale, array $config )
            // Wait, the filter signature in reference was:
            // add_filter( 'loco_api_translate_loco_auto', array( self::$instance, 'loco_auto_translator_process_batch' ), 0, 4 );
            
            // Re-checking reference:
            /*
            function loco_auto_translator_process_batch(array $targets, array $items, Loco_Locale $locale, array $config) {
            
            Items seems to be an array of ['source' => 'string']
            */
             $batch_data[$index] = $source['source'];
        }

        if ( empty( $batch_data ) ) {
            return $targets;
        }

        $target_lang = $locale->lang; // e.g., 'zh'
        if ( !empty($locale->region) ) {
            $target_lang .= '-' . $locale->region; // e.g., 'zh-TW'
        }

        $translations = $api->translate_batch( $batch_data, $target_lang );

        if ( is_wp_error( $translations ) ) {
            // Log error or handle it. Loco expects an array of strings.
            //Throwing exception might show error in UI
             throw new Exception( $translations->get_error_message() );
        }

        // Map back to targets
        foreach ( $translations as $index => $translated_text ) {
             if ( isset( $targets[$index] ) ) {
                 $targets[$index] = $translated_text;
             } elseif (isset($batch_data[$index])) {
                 // The targets array might be keyed similarly to inputs?
                 // In Loco implementation:
                 /*
                  foreach( $items as $i => $item ){
                     $targets[$i] = ...
                  }
                 */
                 $targets[$index] = $translated_text;
             }
        }

		return $targets;
	}
}
