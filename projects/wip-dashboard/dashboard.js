document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("tableBody");
    const banner = document.getElementById("modeBanner");

    fetch("dashboard.php?mode=" + getMode())
        .then(res => res.json())
        .then(res => {
            renderBanner(res.mode);
            renderTable(res.data);
        });

    function getMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("mode") || "real";
    }

    function renderBanner(mode) {
        if (mode === "demo") {
            banner.className = "banner demo";
            banner.innerText = "DEMO MODE - SIMULATED DATA (SAFE FOR PORTFOLIO)";
        } else {
            banner.className = "banner real";
            banner.innerText = "REAL MODE - LIVE ERP + MES DATA";
        }
    }

    function renderTable(data) {
        tableBody.innerHTML = "";

        data.forEach(row => {
            const deltaClass = row.delta >= 0 ? "positive" : "negative";

            tableBody.innerHTML += `
                <tr>
                    <td>${row.process_code}</td>
                    <td>${row.plan}</td>
                    <td>${row.actual}</td>
                    <td class="${deltaClass}">${row.delta}</td>
                    <td>${row.wip}</td>
                </tr>
            `;
        });
    }
});
