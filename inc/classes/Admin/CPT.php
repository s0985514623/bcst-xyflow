<?php
/**
 * Custom Post Type: BCST
 */

declare(strict_types=1);

namespace J7\WpReactPlugin\Admin;

use J7\WpReactPlugin\Utils\Base;
use J7\WpReactPlugin\Plugin;

/**
 * Class CPT
 */
final class CPT {
	use \J7WpReactPlugin\vendor\J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Post type slug
	 */
	public const POST_TYPE = 'bcst';

	/**
	 * Post metas
	 *
	 * @var array
	 */
	public $post_meta_array = [];
	/**
	 * Rewrite
	 *
	 * @var array
	 */
	public $rewrite = [];

	/**
	 * Constructor
	 */
	public function __construct() {
		$args                  = [
			'post_meta_array' => [ 'meta', 'settings' ],
			'rewrite'         => [
				'template_path' => 'test.php',
				'slug'          => 'test',
				'var'           => Plugin::$snake . '_test',
			],
		];
		$this->post_meta_array = $args['post_meta_array'];
		$this->rewrite         = $args['rewrite'] ?? [];

		\add_action( 'init', [ $this, 'init' ] );

		if ( ! empty( $args['post_meta_array'] ) ) {
			\add_action( 'rest_api_init', [ $this, 'add_post_meta' ] );
		}

		\add_action( 'load-post.php', [ $this, 'init_metabox' ] );
		\add_action( 'load-post-new.php', [ $this, 'init_metabox' ] );

		if ( ! empty( $args['rewrite'] ) ) {
			\add_filter( 'query_vars', [ $this, 'add_query_var' ] );
			\add_filter( 'template_include', [ $this, 'load_custom_template' ], 99 );
		}
	}

	/**
	 * Initialize
	 */
	public function init(): void {
		$this->register_cpt();

		// add {$this->post_type}/{slug}/test rewrite rule
		if ( ! empty( $this->rewrite ) ) {
			\add_rewrite_rule( '^' . self::POST_TYPE . '/([^/]+)/' . $this->rewrite['slug'] . '/?$', 'index.php?post_type=' . self::POST_TYPE . '&name=$matches[1]&' . $this->rewrite['var'] . '=1', 'top' );
			\flush_rewrite_rules();
		}
	}

	/**
	 * Register bcst custom post type
	 */
	public static function register_cpt(): void {

		$labels = [
			'name'                     => \esc_html__( 'BCST', 'bcst-xyflow' ),
			'singular_name'            => \esc_html__( 'BCST', 'bcst-xyflow' ),
			'add_new'                  => \esc_html__( '新增', 'bcst-xyflow' ),
			'add_new_item'             => \esc_html__( '新增項目', 'bcst-xyflow' ),
			'edit_item'                => \esc_html__( '編輯', 'bcst-xyflow' ),
			'new_item'                 => \esc_html__( '新增', 'bcst-xyflow' ),
			'view_item'                => \esc_html__( '檢視', 'bcst-xyflow' ),
			'view_items'               => \esc_html__( '檢視', 'bcst-xyflow' ),
			'search_items'             => \esc_html__( '搜尋 BCST', 'bcst-xyflow' ),
			'not_found'                => \esc_html__( '找不到項目', 'bcst-xyflow' ),
			'not_found_in_trash'       => \esc_html__( '回收桶中找不到項目', 'bcst-xyflow' ),
			'parent_item_colon'        => \esc_html__( '父項目', 'bcst-xyflow' ),
			'all_items'                => \esc_html__( '全部', 'bcst-xyflow' ),
			'archives'                 => \esc_html__( 'BCST 彙整', 'bcst-xyflow' ),
			'attributes'               => \esc_html__( 'BCST 屬性', 'bcst-xyflow' ),
			'insert_into_item'         => \esc_html__( '插入到此項目', 'bcst-xyflow' ),
			'uploaded_to_this_item'    => \esc_html__( '上傳到此項目', 'bcst-xyflow' ),
			'featured_image'           => \esc_html__( '精選圖片', 'bcst-xyflow' ),
			'set_featured_image'       => \esc_html__( '設定精選圖片', 'bcst-xyflow' ),
			'remove_featured_image'    => \esc_html__( '移除精選圖片', 'bcst-xyflow' ),
			'use_featured_image'       => \esc_html__( '使用精選圖片', 'bcst-xyflow' ),
			'menu_name'                => \esc_html__( 'BCST', 'bcst-xyflow' ),
			'filter_items_list'        => \esc_html__( '篩選 BCST 列表', 'bcst-xyflow' ),
			'filter_by_date'           => \esc_html__( '依日期篩選', 'bcst-xyflow' ),
			'items_list_navigation'    => \esc_html__( 'BCST 列表導覽', 'bcst-xyflow' ),
			'items_list'               => \esc_html__( 'BCST 列表', 'bcst-xyflow' ),
			'item_published'           => \esc_html__( 'BCST 已發布', 'bcst-xyflow' ),
			'item_published_privately' => \esc_html__( 'BCST 已私人發布', 'bcst-xyflow' ),
			'item_reverted_to_draft'   => \esc_html__( 'BCST 已轉為草稿', 'bcst-xyflow' ),
			'item_scheduled'           => \esc_html__( 'BCST 已排程', 'bcst-xyflow' ),
			'item_updated'             => \esc_html__( 'BCST 已更新', 'bcst-xyflow' ),
		];
		$args   = [
			'label'                 => \esc_html__( 'BCST', 'bcst-xyflow' ),
			'labels'                => $labels,
			'description'           => '',
			'public'                => true,
			'hierarchical'          => false,
			'exclude_from_search'   => false, // 允許被搜尋（包括 Elementor）
			'publicly_queryable'    => true,
			'show_ui'               => true,
			'show_in_nav_menus'     => true,  // 允許在導航選單中顯示
			'show_in_admin_bar'     => true,  // 允許在管理列中顯示
			'show_in_rest'          => true,
			'query_var'             => true,  // 啟用查詢變數（Elementor 需要）
			'can_export'            => true,
			'delete_with_user'      => true,
			'has_archive'           => true,  // 啟用存檔頁面
			'rest_base'             => '',
			'show_in_menu'          => true,
			'menu_position'         => 6,
			'menu_icon'             => 'dashicons-networking',
			'capability_type'       => 'post',
			'supports'              => [ 'title', 'editor', 'thumbnail', 'custom-fields', 'author' ],
			'taxonomies'            => [],
			'rest_controller_class' => 'WP_REST_Posts_Controller',
			'rewrite'               => [
				'slug'       => 'bcst',
				'with_front' => true,
			],
		];

		\register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Register meta fields for post type to show in rest api
	 */
	public function add_post_meta(): void {
		foreach ( $this->post_meta_array as $meta_key ) {
			\register_meta(
				'post',
				Plugin::$snake . '_' . $meta_key,
				[
					'type'         => 'string',
					'show_in_rest' => true,
					'single'       => true,
				]
			);
		}
	}

	/**
	 * Meta box initialization.
	 */
	public function init_metabox(): void {
		\add_action( 'add_meta_boxes', [ $this, 'add_metabox' ] );
		\add_action( 'save_post', [ $this, 'save_metabox' ], 10, 2 );
		\add_filter( 'rewrite_rules_array', [ $this, 'custom_post_type_rewrite_rules' ] );
	}

	/**
	 * Adds the meta box.
	 *
	 * @param string $post_type Post type.
	 */
	public function add_metabox( string $post_type ): void {
		if ( self::POST_TYPE === $post_type ) {
			\add_meta_box(
				Plugin::$kebab . '-metabox',
				Plugin::$app_name,
				[ $this, 'render_meta_box' ],
				$post_type,
				'advanced',
				'high'
			);
		}
	}

	/**
	 * Render meta box.
	 */
	public function render_meta_box(): void {
		// phpcs:ignore
		echo '<div id="' . \esc_attr( Plugin::$snake . '_metabox' ) . '"></div>';
	}


	/**
	 * Add query var
	 *
	 * @param array $vars Vars.
	 * @return array
	 */
	public function add_query_var( $vars ) {
		$vars[] = $this->rewrite['var'];
		return $vars;
	}

	/**
	 * Custom post type rewrite rules
	 *
	 * @param array $rules Rules.
	 * @return array
	 */
	public function custom_post_type_rewrite_rules( $rules ) {
		global $wp_rewrite;
		$wp_rewrite->flush_rules();
		return $rules;
	}

	/**
	 * Save the meta when the post is saved.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public function save_metabox( $post_id, $post ) { // phpcs:ignore
		// phpcs:disable
		/*
		* We need to verify this came from the our screen and with proper authorization,
		* because save_post can be triggered at other times.
		*/

		// Check if our nonce is set.
		if ( ! isset( $_POST['_wpnonce'] ) ) {
			return $post_id;
		}

		$nonce = $_POST['_wpnonce'];

		/*
		* If this is an autosave, our form has not been submitted,
		* so we don't want to do anything.
		*/
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}

		$post_type = \sanitize_text_field( $_POST['post_type'] ?? '' );

		// Check the user's permissions.
		if ( self::POST_TYPE !== $post_type ) {
			return $post_id;
		}

		if ( ! \current_user_can( 'edit_post', $post_id ) ) {
			return $post_id;
		}

		/* OK, it's safe for us to save the data now. */

		// Sanitize the user input.
		$meta_data = \sanitize_text_field( $_POST[ Plugin::$snake . '_meta' ] );

		// Update the meta field.
		\update_post_meta( $post_id, Plugin::$snake . '_meta', $meta_data );
	}

	/**
	 * Load custom template
	 * Set {Plugin::$kebab}/{slug}/report  php template
	 *
	 * @param string $template Template.
	 */
	public function load_custom_template( $template ) {
		$repor_template_path = Plugin::$dir . '/inc/templates/' . $this->rewrite['template_path'];

		if ( \get_query_var( $this->rewrite['var'] ) ) {
			if ( file_exists( $repor_template_path ) ) {
				return $repor_template_path;
			}
		}
		return $template;
	}
}

