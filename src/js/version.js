let versionNumber = "1.4";
document.addEventListener('DOMContentLoaded', function () {
    var versionDate = "04.05.2024."
    var versionElements = document.querySelectorAll('[app-version]');

    versionElements.forEach(function (element) {
        element.innerHTML = versionNumber;
    });
    document.getElementById("versionDate").innerHTML = versionDate;
}); 