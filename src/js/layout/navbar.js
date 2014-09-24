'use strict';
/* global document */
/* global window */
/* global $ */

// Navbar toggling on scroll
$(window).scroll(function() {
    var $navbar = $('.navbar'),
        togglingCssClass = 'navbar-fixed-top',
        togglingCssClass1 = 'navbar-default',
        togglingCssClass2 = 'navbar-inverse',
        togglingHeight = $('.home-section').height();

    if (!$navbar.hasClass(togglingCssClass) && $(window).scrollTop() > togglingHeight) {
        $navbar.addClass(togglingCssClass);
        $navbar.removeClass(togglingCssClass1);
        $navbar.addClass(togglingCssClass2);
    }
    else if ($navbar.hasClass(togglingCssClass) && $(window).scrollTop() < togglingHeight) {
        $navbar.removeClass(togglingCssClass);
        $navbar.removeClass(togglingCssClass2);
        $navbar.addClass(togglingCssClass1);
    }
});

// Navbar link'n'scroll
$(document).ready(function() {
    $('.navbar').onePageNav({
        currentClass: 'active',
        changeHash: true,
        scrollSpeed: 500
    });


    $('.tooltip').tooltipster({
        theme: 'tooltipster-welean'
    });
});