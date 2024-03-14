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


async function Swalfire(options) {
    return await Swal.fire({
        heightAuto: false,
        customClass: {
            confirmButton: "px-5 rounded-5 btn btn-success ms-2 shadow-sm",
            cancelButton: "px-3 rounded-5 btn btn-danger ms-2 shadow-sm",
            popup: "rounded-5",
            input: "rounded-5"
        },
        buttonsStyling: false,
        ...options
    });
}

function Swalmixin(options) {
    return Swal.mixin({
        heightAuto: false,
        customClass: {
            confirmButton: "px-5 rounded-5 btn btn-success ms-2 shadow-sm",
            cancelButton: "px-3 rounded-5 btn btn-danger ms-2 shadow-sm",
            popup: "rounded-5"
        },
        buttonsStyling: false,
        ...options
    });
}