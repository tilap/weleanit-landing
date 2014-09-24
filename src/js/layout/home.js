'use strict';
/* global window */
/* global $ */

// Set home to full screen height
var sectionHomeInitialHeight = 0;
function screenResize() {
    var $home = $('.home-section'),
        $content = $('.home-section .content');

    if(0===sectionHomeInitialHeight) {
        sectionHomeInitialHeight = parseInt($home.height(), 10);
    }
    if($home.height() < sectionHomeInitialHeight) {
        $home.height(sectionHomeInitialHeight);
        $content.css('paddingTop', 0);
    }
    else {
        $home.height($(window).height());
        var paddingTop = (parseInt($(window).height(), 10) - sectionHomeInitialHeight ) / 2;
        $content.css('paddingTop', paddingTop);
    }
    $home.width($(window).width());
}

$(window).resize(function() {
    screenResize();
});

screenResize();