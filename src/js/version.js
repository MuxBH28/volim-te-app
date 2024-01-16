document.addEventListener('DOMContentLoaded', function () {
    var versionNumber = "v1.1";
    var versionDate = "16.01.2023."
    var versionElements = document.querySelectorAll('[app-version]');

    versionElements.forEach(function (element) {
        element.innerHTML = versionNumber;
    });
    document.getElementById("versionDate").innerHTML = versionDate;
}); 