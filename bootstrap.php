<?php

use NewfoldLabs\WP\ModuleLoader\Container;
use NewfoldLabs\WP\Module\ECommerce\ECommerce;

use function NewfoldLabs\WP\ModuleLoader\register;

if ( function_exists( 'add_action' ) ) {

	add_action(
		'plugins_loaded',
		function () {
			register(
				[
					'name'     => 'ecommerce',
					'label'    => __( 'eCommerce', 'newfold-module-ecommerce' ),
					'callback' => function ( Container $container ) {
						new ECommerce( $container );
					},
					'isActive' => true,
					'isHidden' => true,
				]
			);

		}
	);

}