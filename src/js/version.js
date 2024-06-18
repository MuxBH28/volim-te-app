let versionNumber = "1.5";
document.addEventListener('DOMContentLoaded', function () {
    var versionDate = "18.06.2024."
    var versionElements = document.querySelectorAll('[app-version]');

    versionElements.forEach(function (element) {
        element.innerHTML = versionNumber;
    });
    document.getElementById("versionDate").innerHTML = versionDate;
}); 