document.addEventListener('DOMContentLoaded', function () {
    var versionNumber = "v1.0";
    var versionDate = "24.12.2023."
    var versionElements = document.querySelectorAll('[app-version]');

    versionElements.forEach(function (element) {
        element.innerHTML = versionNumber;
    });
    document.getElementById("versionDate").innerHTML = versionDate;
}); 