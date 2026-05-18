
jQuery(document).ready(function() {
    var url      = window.location.href;
    console.log(url);
    jQuery(".nav-link[href='"+url+"']").addClass("nav-link-active");
    
})