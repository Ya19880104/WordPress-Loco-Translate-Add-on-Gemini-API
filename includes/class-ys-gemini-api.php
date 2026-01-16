<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class YS_Gemini_API {

	private $api_key;
	private $model;
    private $api_url;

	public function __construct() {
		$this->api_key = get_option( 'ys_loco_gemini_api_key' );
		$this->model = get_option( 'ys_loco_gemini_model', 'gemini-1.5-flash' );
        $this->api_url = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";
	}

    public function set_api_key( $key ) {
        $this->api_key = $key;
    }

	public function translate_batch( array $texts, $target_locale ) {
		if ( empty( $this->api_key ) ) {
			return new WP_Error( 'missing_api_key', __( 'Gemini API Key is missing.', 'ys-loco-ai-gemini' ) );
		}

        $default_prompt = "You are a %language% translator. Please translate the WordPress Plugin strings. As this is a plugin translation, you must preserve dynamic placeholders such as %s, %%, etc. Translate: %source%";
        $prompt_template = get_option( 'ys_loco_gemini_prompt', $default_prompt );

        // Replace placeholders
        $prompt_instruction = str_replace( '%language%', $target_locale, $prompt_template );
        // For JSON batch, we replace %source% with a specific instruction for JSON
        $prompt_instruction = str_replace( '%source%', 'the following JSON object values. Keep keys exactly as they are. Return only the valid JSON response.', $prompt_instruction );

        
        // Prepare JSON payload
        $json_payload = json_encode($texts, JSON_UNESCAPED_UNICODE);

        $request_body = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt_instruction . "\n\n" . $json_payload]
                    ]
                ]
            ],
            'generationConfig' => [
                'responseMimeType' => 'application/json'
            ]
        ];

		$response = wp_remote_post( $this->api_url . '?key=' . $this->api_key, array(
			'body'    => json_encode( $request_body ),
			'headers' => array( 'Content-Type' => 'application/json' ),
			'timeout' => 30,
		) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

        $response_code = wp_remote_retrieve_response_code( $response );
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( $response_code !== 200 ) {
             return new WP_Error( 'api_error', 'Gemini API Error: ' . ($data['error']['message'] ?? 'Unknown error') );
        }

        if ( isset( $data['candidates'][0]['content']['parts'][0]['text'] ) ) {
            $translated_json_tring = $data['candidates'][0]['content']['parts'][0]['text'];
            $translated_texts = json_decode( $translated_json_tring, true );
            
            if ( is_array( $translated_texts ) ) {
                return $translated_texts;
            } else {
                 return new WP_Error( 'json_parse_error', __( 'Failed to parse Gemini response as JSON.', 'ys-loco-ai-gemini' ) );
            }
        }

		return new WP_Error( 'invalid_response', __( 'Invalid response from Gemini API.', 'ys-loco-ai-gemini' ) );
	}
}
