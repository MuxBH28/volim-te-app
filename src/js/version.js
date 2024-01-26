document.addEventListener('DOMContentLoaded', function () {
    var versionNumber = "v1.2";
    var versionDate = "26.01.2023."
    var versionElements = document.querySelectorAll('[app-version]');

    versionElements.forEach(function (element) {
        element.innerHTML = versionNumber;
    });
    document.getElementById("versionDate").innerHTML = versionDate;
}); 