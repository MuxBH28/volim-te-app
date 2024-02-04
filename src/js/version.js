let versionNumber = "1.3";
document.addEventListener('DOMContentLoaded', function () {
    var versionDate = "05.02.2024."
    var versionElements = document.querySelectorAll('[app-version]');

    versionElements.forEach(function (element) {
        element.innerHTML = versionNumber;
    });
    document.getElementById("versionDate").innerHTML = versionDate;
}); 