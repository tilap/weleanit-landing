require('./misc/console-fix');
require('./misc/external-links-in-new-window');
require('./layout/home');
require('./layout/navbar');

// jshint ignore: start
var gaConfig = require('../../config.js').app.ga;

(function(i,s,o,g,r,a,m){
    i['GoogleAnalyticsObject']=r;
    i[r]=i[r] || function() {
        ( 
        i[r].q=i[r].q || []).push( arguments )},
        i[r].l=1*new Date();
        a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];
        a.async=1;
        a.src=g;
        m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', gaConfig.id, gaConfig.name);
ga('send', 'pageview');
// jshint ignore: end
