<?php
/**
 * Flow API: REST API endpoints for XYFlow data
 */

declare(strict_types=1);

namespace J7\WpReactPlugin\Api;

use J7\WpReactPlugin\Plugin;

/**
 * Class FlowApi
 */
final class FlowApi {
	use \J7WpReactPlugin\vendor\J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Meta key for storing flow data
	 */
	public const FLOW_META_KEY = 'bcst_xyflow_data';

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes(): void {
		$namespace = 'bcst-xyflow/v1';

		// GET /wp-json/bcst-xyflow/v1/flow/{post_id}
		\register_rest_route(
			$namespace,
			'/flow/(?P<post_id>\d+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_flow_data' ],
				'permission_callback' => [ $this, 'get_permission_check' ],
				'args'                => [
					'post_id' => [
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					],
				],
			]
		);

		// POST /wp-json/bcst-xyflow/v1/flow/{post_id}
		\register_rest_route(
			$namespace,
			'/flow/(?P<post_id>\d+)',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'save_flow_data' ],
				'permission_callback' => [ $this, 'save_permission_check' ],
				'args'                => [
					'post_id' => [
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					],
				],
			]
		);
	}

	/**
	 * Permission check for GET request
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return bool|\WP_Error
	 */
	public function get_permission_check( \WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = \get_post( $post_id );

		if ( ! $post ) {
			return new \WP_Error( 'not_found', __( 'Post not found', 'bcst-xyflow' ), [ 'status' => 404 ] );
		}

		// Allow read access if post is published or user can edit
		if ( 'publish' === $post->post_status || \current_user_can( 'edit_post', $post_id ) ) {
			return true;
		}

		return new \WP_Error( 'forbidden', __( 'You do not have permission to access this resource', 'bcst-xyflow' ), [ 'status' => 403 ] );
	}

	/**
	 * Permission check for POST request
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return bool|\WP_Error
	 */
	public function save_permission_check( \WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! \current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'forbidden', __( 'You do not have permission to edit this resource', 'bcst-xyflow' ), [ 'status' => 403 ] );
		}

		return true;
	}

	/**
	 * Get flow data from post meta
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_flow_data( \WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = \get_post( $post_id );

		if ( ! $post ) {
			return new \WP_Error( 'not_found', __( 'Post not found', 'bcst-xyflow' ), [ 'status' => 404 ] );
		}

		$flow_data = \get_post_meta( $post_id, self::FLOW_META_KEY, true );

		// Return default empty structure if no data exists
		if ( empty( $flow_data ) ) {
			$flow_data = [
				'nodes'    => [],
				'edges'    => [],
				'viewport' => [
					'x'    => 0,
					'y'    => 0,
					'zoom' => 1,
				],
			];
		} else {
			// Decode if stored as JSON string
			if ( is_string( $flow_data ) ) {
				$flow_data = json_decode( $flow_data, true );
			}
		}

		return new \WP_REST_Response(
			[
				'success' => true,
				'data'    => [
					'post_id'   => $post_id,
					'flow_data' => $flow_data,
				],
			],
			200
		);
	}

	/**
	 * Save flow data to post meta
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function save_flow_data( \WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		$post    = \get_post( $post_id );

		if ( ! $post ) {
			return new \WP_Error( 'not_found', __( 'Post not found', 'bcst-xyflow' ), [ 'status' => 404 ] );
		}

		$body = $request->get_json_params();

		if ( ! isset( $body['flow_data'] ) ) {
			return new \WP_Error( 'invalid_data', __( 'Flow data is required', 'bcst-xyflow' ), [ 'status' => 400 ] );
		}

		$flow_data = $body['flow_data'];

		// Validate flow data structure
		if ( ! is_array( $flow_data ) ) {
			return new \WP_Error( 'invalid_data', __( 'Flow data must be an object', 'bcst-xyflow' ), [ 'status' => 400 ] );
		}

		// Ensure required keys exist
		$flow_data = wp_parse_args(
			$flow_data,
			[
				'nodes'    => [],
				'edges'    => [],
				'viewport' => [
					'x'    => 0,
					'y'    => 0,
					'zoom' => 1,
				],
			]
		);

		// Save as JSON string (with JSON_UNESCAPED_UNICODE to preserve Chinese characters)
		$json_data = wp_json_encode( $flow_data, JSON_UNESCAPED_UNICODE );
		$result    = \update_post_meta( $post_id, self::FLOW_META_KEY, $json_data );

		if ( false === $result ) {
			// Check if value is the same (update_post_meta returns false if value unchanged)
			$existing = \get_post_meta( $post_id, self::FLOW_META_KEY, true );
			if ( $existing !== $json_data ) {
				return new \WP_Error( 'save_failed', __( 'Failed to save flow data', 'bcst-xyflow' ), [ 'status' => 500 ] );
			}
		}

		return new \WP_REST_Response(
			[
				'success' => true,
				'message' => __( 'Flow data saved successfully', 'bcst-xyflow' ),
				'data'    => [
					'post_id'   => $post_id,
					'flow_data' => $flow_data,
				],
			],
			200
		);
	}
}
