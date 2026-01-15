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
	}

	public static function register_provider( $apis ) {
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
     * @param array $sources Strings to translate
     * @param array $locale Target locale object (Loco_Locale)
     * @param array $config API configuration
     */
	public static function process_batch( array $targets, array $sources, $locale ) {
        
        $api = new YS_Gemini_API();
        
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
