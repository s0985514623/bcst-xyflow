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
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_flow( $atts = [] ): string {
		$atts = \shortcode_atts(
			[
				'height' => '600px',
				'width'  => '100%',
			],
			$atts,
			'bcst_xyflow'
		);

		$style = sprintf(
			'width: %s; height: %s;',
			\esc_attr( $atts['width'] ),
			\esc_attr( $atts['height'] )
		);

		return sprintf(
			'<div id="%s" style="%s"></div>',
			\esc_attr( Plugin::$snake ),
			$style
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
