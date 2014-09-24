'use strict';

/* global $*/
/* global document */
/* global location */

// Add target="_blank" to all external link.
$(document).ready(function() {
    $('a').filter(function() {
        return this.hostname && this.hostname !== location.hostname;
    }).attr('target', '_blank');
});