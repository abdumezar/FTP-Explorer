window.addEventListener('DOMContentLoaded', function () {
    adjustMainParentHeight();
    window.addEventListener('resize', adjustMainParentHeight);
});

function adjustMainParentHeight() {
    var headerHeight = document.querySelector('header').offsetHeight;
    var footerHeight = document.querySelector('footer').offsetHeight;
    var mainParent = document.querySelector('.main-parent');
    var windowHeight = window.innerHeight;
    mainParent.style.minHeight = (windowHeight - headerHeight - footerHeight) + 'px';

    var headerH = document.querySelector('.headerH');
    headerH.style.height = headerHeight + 'px';

    var footerH = document.querySelector('.footerH');
    footerH.style.height = footerHeight + 'px';

    var H1H = document.querySelector('h1').offsetHeight + 20;

    var innerMyOverFlowH = document.querySelector('.my-overflow');
    innerMyOverFlowH.style.height = (windowHeight - headerHeight - footerHeight - H1H) + 'vh';
}
