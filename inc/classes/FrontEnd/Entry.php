<?php
/**
 * Front-end Entry
 */

declare(strict_types=1);

namespace J7\WpReactPlugin\FrontEnd;

use J7\WpReactPlugin\Utils\Base;
use J7\WpReactPlugin\Plugin;
use J7\WpReactPlugin\Admin\CPT;

/**
 * Class Entry
 */
final class Entry {
	use \J7WpReactPlugin\vendor\J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor
	 */
	public function __construct() {
		// \add_action( 'wp_footer', [ $this, 'render_app' ] );
		\add_shortcode( 'bcst_xyflow', [ $this, 'render_flow' ] );
		// 自動在 bcst 文章類型的內容中顯示 Flow
		\add_filter( 'the_content', [ $this, 'append_flow_to_content' ] );
	}

	/**
	 * Render application's markup
	 */
	public function render_app(): void {
		// phpcs:ignore
		echo '<div id="' . \esc_attr( Plugin::$snake ) . '"></div>';
	}

	/**
	 * Render Flow editor via shortcode [bcst_xyflow]
	 *
	 * Usage:
	 * [bcst_xyflow] - 使用當前文章 ID
	 * [bcst_xyflow id="123"] - 指定文章 ID
	 * [bcst_xyflow id="123" height="800px" width="100%"] - 指定文章 ID 和尺寸
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_flow( $atts = [] ): string {
		$atts = \shortcode_atts(
			[
				'id'     => '', // 可指定 post ID，留空則使用當前文章
				'height' => '600px',
				'width'  => '100%',
			],
			$atts,
			'bcst_xyflow'
		);

		// 決定要使用的 post ID
		$post_id = ! empty( $atts['id'] ) ? (int) $atts['id'] : \get_the_ID();

		// 驗證 post ID 是否有效
		if ( ! $post_id || ! \get_post( $post_id ) ) {
			return '<div class="bcst-xyflow-error">無效的文章 ID</div>';
		}

		$style = sprintf(
			'width: %s; height: %s;',
			\esc_attr( $atts['width'] ),
			\esc_attr( $atts['height'] )
		);

		// 使用唯一 ID 以支援同頁多個短碼
		$container_id = Plugin::$snake . '_' . $post_id;

		return sprintf(
			'<div id="%s" class="bcst-xyflow-shortcode" style="%s" data-post-id="%d"></div>',
			\esc_attr( $container_id ),
			$style,
			$post_id
		);
	}

	/**
	 * Prepend Flow editor to post content for bcst post type
	 *
	 * @param string $content Post content.
	 * @return string
	 */
	public function append_flow_to_content( string $content ): string {
		// 只在 bcst 文章類型的單篇頁面添加
		if ( ! \is_singular( CPT::POST_TYPE ) ) {
			return $content;
		}

		// 確保在主查詢的迴圈中
		if ( ! \in_the_loop() || ! \is_main_query() ) {
			return $content;
		}

		$flow_container = sprintf(
			'<div id="%s" class="bcst-xyflow-container" style="width: 100%%; height: 600px;"></div>',
			\esc_attr( Plugin::$snake )
		);

		// 先顯示 XYFlow，再顯示 content
		return $flow_container . $content;
	}
}
