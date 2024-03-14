var currentPath = "";
var allowedExt = "";
var replacePath = "";
var backPath = "";

$('#ftp').addClass('active');

if (localStorage.getItem("currentPath") !== null) {
    ReConnect();
}

function ReConnect() {
    $.ajax({
        url: "/FTP/reconnect",
        type: "Post",
        contentType: false,
        processData: false,
        success: function () {
            $('#explorer').removeClass('d-none');
            $("#connect-btn").html("Connected!").removeClass("btn-warning").addClass("btn-success");
            $("#connectionResponse").html("Connected Successfully!").addClass("text-success");
            $('#upload-modal-btn').removeClass('d-none');
            $('#ConnectModal').modal('hide');
            $('#connectionResponse').html('');
            $('#ConnectionModalBtn').html('Disconnect').removeClass('btn-primary').addClass('btn-danger');
            lastPath = localStorage.getItem("currentPath");
            if (lastPath == null) {
                lastPath = "";
                localStorage.setItem("currentPath", lastPath);
            }
            getFiles(lastPath);
        },
        error: function () {
            Disconnected();
        }
    });
}

function getFiles(path) {
    currentPath = path;
    if (path.length != 0) {
        localStorage.setItem("currentPath", path);
    } else {
        localStorage.setItem("currentPath", "");
    }

    $("#loadingIcon").removeClass("d-none");
    $.ajax({
        url: "/FTP/show?path=" + path,
        type: "GET",
        success: function (response) {
            $("#showFiles").html("");
            buildPaths(path);
            if (path.length != 0) {
                $("#showFiles").append(`
                    <tr onclick="getFiles('${backPath}')">
                        <td class="ps-4 cursor-pointer align-middle fw-bolder" colspan="4">
                            <i class="fa-solid fa-chevron-left me-2"></i>
                            Go Back
                        </td>
                    </tr>`);
            }
            response.forEach(function (item) {
                var listItem;
                if (item.type === 1) {
                    listItem = `
                    <tr onclick="getFiles('${item.path}')">
                        <td class="ps-4 cursor-pointer align-middle" colspan="4">
                            <i class="fa-solid fa-folder me-2"></i>
                            ${item.name}
                        </td>
                    </tr>`;
                } else {
                    listItem = `
                    <tr class="align-middle">
                        <td class="ps-4 col-5">
                            <i class="fa-solid fa-file me-2"></i>
                            ${item.name}
                        </td>
                        <td class="col-3">${item.size}</td>
                        <td class="col-3">${item.lastModified}</td>
                        <td class="col-4">
                            <div class="d-flex justify-content-around">
                                <i class="px-5 py-2 rounded-4 btn btn-outline-primary ${isImage(item.path) ? "d-block" : "invisible"} fa-solid fa-eye me-3" title="Preview Image" onclick="previewImage('${item.path}')"></i>
                                <i class="px-5 py-2 rounded-4 btn btn-outline-warning fa-solid fa-arrow-right-arrow-left me-3" title="Exchange The Same File" onclick="replaceFile('${item.path}')"></i>
                                <i class="px-5 py-2 rounded-4 btn btn-outline-success fa-solid fa-download me-3 cursor-pointer" title="Download This File" onclick="downloadFile('${item.path}')"></i>
                                <i class="px-5 py-2 rounded-4 btn btn-outline-danger fa-solid fa-trash-can cursor-pointer" title="Delete This File" onclick="deleteFile('${item.path}')"></i>
                            </div>
                        </td>
                    </tr>`;
                }
                $("#showFiles").append(listItem);
            });
            
            $("#loadingIcon").addClass("d-none");
            
        },
        error: function () {
            Disconnected();
        }
    });
}

function downloadFile(path) {
    $("#loadingIcon").removeClass("d-none");
    $.ajax({
        url: "/FTP/download?path=" + path,
        type: "GET",
        success: function (data) {
            var anchor = document.createElement("a");
            anchor.href = "data:" + data.contentType + ";base64," + data.base64;
            var pathSegments = path.split("/");
            anchor.download = pathSegments[pathSegments.length - 1];
            anchor.click();
            $("#loadingIcon").addClass("d-none");
        },
        error: function () {
            Disconnected();
        }
    });
}

async function deleteFile(path) {
    $("#loadingIcon").removeClass("d-none");
    const swalWithBootstrapButtons = Swalmixin({
        customClass: {
            confirmButton: "px-5 rounded-5 btn btn-danger ms-2 shadow-sm",
            cancelButton: "px-3 rounded-5 btn btn-secondary ms-2 shadow-sm",
            popup: "rounded-5",
        },
        buttonsStyling: false,
    });

    swalWithBootstrapButtons
        .fire({
            title: "are you sure you need to delete this file?",
            text: "you can not restore deleted items!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Delete it!",
            cancelButtonText: "No, Cancel!",
            reverseButtons: true,
        })
        .then(async (result) => {
            if (result.isConfirmed) {
                const loadingSwal = swalWithBootstrapButtons.mixin({
                    title: "Please waite ...",
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    showCancelButton: false,
                    timerProgressBar: true,
                    timer: 5000,
                });

                loadingSwal.fire();

                $.ajax({
                    url: "/FTP/delete?path=" + path,
                    type: "GET",
                    success: async function (response) {
                        getFiles(currentPath);
                        loadingSwal.close();
                        await swalWithBootstrapButtons.fire({
                            title: "Deleted Successfully!",
                            text: "the file has been deleted from the server.",
                            icon: "success",
                        });
                        return;
                    },
                    error: function (error) {
                        Disconnected();
                        loadingSwal.update({
                            timer: 2000,
                        });
                    },
                });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                swalWithBootstrapButtons.fire({
                    title: "Cancelled Successfully",
                    text: "your data are safe, don't worry.",
                    icon: "success",
                });
            }
        });
    $("#loadingIcon").addClass("d-none");
}

function replaceFile(path) {
    splitted = path.split(".");
    extention = splitted[splitted.length - 1];
    $("#files").attr("accept", `.${extention}`);
    $("#files").attr("multiple", false);
    $("#uploadModal").modal("show");
    allowedExt = extention;
    replacePath = path;
}

$("#upload-btn").on("click", () => {
    upload();
});

function upload() {
    if ($("#files").get(0).files.length === 0) {
        return;
    }

    var file = $("#files").get(0).files[0];
    var ext = file.name.split(".").pop();
    if (allowedExt != "" && ext != allowedExt) {
        Swalfire({
            icon: "error",
            title: "Oops...",
            text: `You can only upload ${allowedExt} files! [the same extention as the original file you want to exchange].`,
        });
        return;
    }

    $("#upload-btn").html('<i class="fa-solid fa-spinner fa-spin-pulse"></i>');
    $("#upload-btn").prop("disabled", true);
    var formData = new FormData($("#upload-form")[0]);
    if (replacePath != "") {
        formData.append("path", replacePath);
        formData.append("replace", 1);
        allowedExt = "";
        replacePath = "";
    } else {
        formData.append("path", currentPath);
        formData.append("replace", 0);
    }

    $.ajax({
        url: "/FTP/upload",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: () => {
            getFiles(currentPath);
            setTimeout(() => {
                $("#uploadModal").modal("hide");
                $("#upload-form")[0].reset();
                $("#upload-btn").html("Upload");
                $("#upload-btn").prop("disabled", false);
            }, 2000);
        },
        error: function () {
            Disconnected();
        }
    });
    $("#files").attr("accept", "");
    $("#files").attr("multiple", true);
}

function previewImage(path) {
    if (!isImage(path)) {
        Swalfire({
            icon: "error",
            title: "Oops...",
            text: "This file is not an image!",
        });
        return;
    }

    $("#loadingIcon").removeClass("d-none");
    $.ajax({
        url: "/FTP/download?path=" + path,
        type: "GET",
        success: function (data) {
            $("#PreviewModal").modal("show");
            var img = document.createElement("img");
            img.src = "data:" + data.contentType + ";base64," + data.base64;
            img.alt = path;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.maxHeight = "90vh";
            var previewArea = document.getElementById("previewArea");
            previewArea.innerHTML = "";
            previewArea.appendChild(img);
            $("#loadingIcon").addClass("d-none");
        },
        error: function () {
            Disconnected();
        }
    });
}

$("#connect-btn").on("click", () => {
    $("#connect-btn").html('<i class="fa-solid fa-spinner fa-spin-pulse"></i>');
    $("#connect-btn").prop("disabled", true);
    $("#connect-btn").removeClass("btn-primary");
    $("#connect-btn").addClass("btn-warning");
    var formData = new FormData($("#connect-form")[0]);

    formData.append("Host", $("#ftpHost").val());
    formData.append("UserName", $("#ftpUser").val());
    formData.append("Password", $("#ftpPass").val());

    $.ajax({
        url: "/FTP/connect",
        type: "Post",
        data: formData,
        contentType: false,
        processData: false,
        success: function () {
            $('#explorer').removeClass('d-none');
            $('#ConnectModal').modal('hide');
            $('#ConnectionModalBtn').html('Disconnect');
            $('#ConnectionModalBtn').removeClass('btn-primary');
            $('#ConnectionModalBtn').addClass('btn-danger');
            $("#connect-btn").html("Connected!");
            $("#connect-btn").removeClass("btn-warning");
            $("#connect-btn").addClass("btn-success");
            $("#connectionResponse").addClass("text-success");
            $("#connectionResponse").html("Connected Successfully!");
            $('#upload-modal-btn').removeClass('d-none');
            localStorage.setItem("currentPath", '');
            getFiles('');
        },
        error: function () {
            Disconnected();
        },
    });
});

$("#ConnectionModalBtn").on("click", () => {
    if ($("#ConnectionModalBtn").html() === "Disconnect") {
        Disconnected();
        $.ajax({
            url: "/FTP/disconnect",
            type: "Post",
            contentType: false,
            processData: false
        });
    }
});

function isImage(path) {
    const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".bmp",
        ".tiff",
        ".webp",
    ];

    for (const extension of imageExtensions) {
        if (path.endsWith(extension)) {
            return true;
        }
    }

    return false;
}

function buildPaths(path) {
    var segments = path.split("/");
    var partialPath = `<li class="cursor-pointer breadcrumb-item" onclick="getFiles('')">Root</li>`;
    $("#path").html("");
    var cummulative = "";
    for (var i = 1; i < segments.length; i++) {
        cummulative += "/" + segments[i];
        partialPath += `<li class="cursor-pointer breadcrumb-item" onclick = "getFiles('${cummulative}')"> ${segments[i]} </li>`;
        if (i == segments.length - 2) {
            backPath = cummulative;
        }
    }

    if (segments.length <= 2) {
        backPath = "";
    }

    $("#path").append(partialPath);
    $("#path li:last-child").addClass("text-primary");
}

function Disconnected() {
    $('#ConnectionModalBtn').html('Connect to FTP Server').removeClass('btn-danger').addClass('btn-primary');
    $("#connectionResponse").html("");
    $('#upload-modal-btn').addClass('d-none');
    $('#loadingIcon').addClass('d-none');
    $('#ftpHost').val("");
    $('#ftpUser').val("");
    $('#ftpPass').val("");
    $('#explorer').addClass('d-none');
    $("#connect-btn").prop("disabled", false).html("Connect").removeClass("btn-warning btn-success").addClass("btn-primary");
    localStorage.removeItem("currentPath");
}