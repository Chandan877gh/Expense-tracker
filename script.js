// ================== EXPENSE TRACKER SCRIPT ==================

// Grab DOM elements
const form = document.getElementById("expense-form");
const ctx = document.getElementById("expense-chart").getContext("2d");
const monthlySummary = document.getElementById("monthly-summary");

// Load expenses from localStorage or start empty
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Save to localStorage
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Render expense list
function renderExpenses() {
  const tableBody = document.getElementById("expense-list");
  tableBody.innerHTML = "";

  expenses.forEach((exp, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>${Number(exp.amount).toFixed(2)}</td>
      <td>${exp.note}</td>
      <td><button onclick="editExpense(${index}, this)">Edit</button></td>
      <td><button onclick="deleteExpense(${index})">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// Edit expense
function editExpense(index, btn) {
  const row = btn.closest("tr");
  const exp = expenses[index];

  if (btn.textContent === "Edit") {
    row.cells[0].innerHTML = `<input type="date" value="${exp.date}">`;
    row.cells[1].innerHTML = `<input type="text" value="${exp.category}">`;
    row.cells[2].innerHTML = `<input type="number" value="${exp.amount}" step="0.01">`;
    row.cells[3].innerHTML = `<input type="text" value="${exp.note}">`;
    btn.textContent = "Save";
  } else {
    const newDate = row.cells[0].querySelector("input").value;
    const newCategory = row.cells[1].querySelector("input").value;
    const newAmount = parseFloat(row.cells[2].querySelector("input").value);
    const newNote = row.cells[3].querySelector("input").value;

    expenses[index] = { date: newDate, category: newCategory, amount: newAmount, note: newNote };
    saveExpenses();
    renderExpenses();
    renderSummary();
  }
}

// Delete expense
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveExpenses();
  renderExpenses();
  renderSummary();
}

// Monthly summary
function renderSummary() {
  monthlySummary.innerHTML = "";
  const monthlyTotals = {};

  expenses.forEach(exp => {
    const month = exp.date.slice(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(exp.amount);
  });

  for (const month in monthlyTotals) {
    const p = document.createElement("p");
    p.textContent = `${month}: ₹${monthlyTotals[month].toFixed(2)}`;
    monthlySummary.appendChild(p);
  }
}

// Handle form submit (only once!)
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const expense = {
    date: document.getElementById("date").value,
    category: document.getElementById("category").value,
    amount: parseFloat(document.getElementById("amount").value),
    note: document.getElementById("note").value
  };
  expenses.push(expense);
  saveExpenses();
  form.reset();
  renderExpenses();
  renderSummary();
});

// Export CSV
document.getElementById("exportBtn").addEventListener("click", function () {
  let table = document.getElementById("expenseTable");
  let rows = table.querySelectorAll("tr");
  let csvContent = "";

  rows.forEach((row, rowIndex) => {
    let cols = row.querySelectorAll("th, td");
    let rowData = [];

    cols.forEach((col, colIndex) => {
      // Skip last 2 columns (Edit, Delete buttons)
      if (colIndex < cols.length - 2) {
        let text = col.innerText.trim();
        if (rowIndex > 0 && colIndex === 2) {
          text = text.replace(/[^0-9.-]+/g, "");
        }
        rowData.push(text);
      }
    });
    csvContent += rowData.join(",") + "\n";
  });

  let blob = new Blob([csvContent], { type: "text/csv" });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "expenses.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Search feature
document.getElementById("searchInput").addEventListener("input", function () {
  let filter = this.value.toLowerCase();
  let rows = document.querySelectorAll("#expense-list tr");

  rows.forEach(row => {
    let text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
});

// Tab switching

// Tab switching
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
    renderChart(); // refresh chart when switching to Graph tab
    renderMonthlyChart();
  });
});

// ================== CHART.JS RENDERING ==================
let expenseChart;
let monthlyChart; // new chart instance

function renderChart() {
  // Aggregate totals by category
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (expenseChart) {
    expenseChart.destroy(); // reset chart if it exists
  }

  expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Expenses by Category",
        data: data,
        backgroundColor: [
          "#FF6384","#36A2EB","#FFCE56",
          "#4BC0C0","#9966FF","#FF9F40"
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Expenses by Category" }
      }
    }
  });
}

// ================== BAR CHART FOR MONTHLY TOTAL ==================
function renderMonthlyChart() {
  // Aggregate totals by month (YYYY-MM)
  const monthlyTotals = {};
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount);
  });

  const labels = Object.keys(monthlyTotals);
  const data = Object.values(monthlyTotals);

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  const monthlyCtx = document.getElementById("expense-chart").getContext("2d");

  monthlyChart = new Chart(monthlyCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Monthly Expenses",
        data: data,
        backgroundColor: "#36A2EB"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Total Expenses per Month" }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Initial render
renderExpenses();
renderSummary();
renderChart();
renderMonthlyChart(); // 👈 call it here

// ================== BILL GALLERY SCRIPT (with Lightbox + Navigation) ==================
// ================== BILL GALLERY SCRIPT (with Triggered Lightbox + Navigation) ==================

// Selectors
const billInput = document.getElementById("billUpload");   // file input
const uploadBtn = document.getElementById("uploadBtn");    // upload button
const billGallery = document.getElementById("billsGallery"); // gallery container
const lightbox = document.getElementById("lightbox");       // lightbox container
const lightboxImg = document.getElementById("lightbox-img");
const lightboxPdf = document.getElementById("lightbox-pdf");
const lightboxClose = document.getElementById("lightbox-close");

// New navigation arrows
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

// Load saved bills from localStorage or empty array
let bills = JSON.parse(localStorage.getItem("bills")) || [];

// Track current index in lightbox
let currentIndex = 0;

// Save bills to localStorage
function saveBills() {
  localStorage.setItem("bills", JSON.stringify(bills));
}

// Render gallery
function renderBills() {
  billGallery.innerHTML = ""; // clear first
  bills.forEach((bill, index) => {
    const item = document.createElement("div");
    item.classList.add("bill-item");

    // Detect PDF or Image
    const isPDF = bill.name.toLowerCase().endsWith(".pdf");

    // Thumbnail preview (click → open in lightbox)
    let previewElement;
    if (isPDF) {
      previewElement = document.createElement("div");
      previewElement.classList.add("pdf-thumb");
      previewElement.textContent = "📄 " + bill.name;
      previewElement.title = "Click to preview PDF";
      previewElement.addEventListener("click", () => openLightbox(index));
    } else {
      previewElement = document.createElement("img");
      previewElement.src = bill.data;
      previewElement.alt = bill.name;
      previewElement.classList.add("thumb");
      previewElement.title = "Click to preview image";
      previewElement.addEventListener("click", () => openLightbox(index));
    }

    // File name
    const namePara = document.createElement("p");
    namePara.classList.add("bill-name");
    namePara.textContent = bill.name;

    // Action buttons
    const actions = document.createElement("div");
    actions.classList.add("bill-actions");

    // Rename
    const renameBtn = document.createElement("button");
    renameBtn.textContent = "Rename";
    renameBtn.addEventListener("click", () => {
      const newName = prompt("Enter new name:", bill.name);
      if (newName) {
        bills[index].name = newName;
        saveBills();
        renderBills();
      }
    });

    // Download
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = bill.data;
      link.download = bills[index].name;
      link.click();
    });

    // Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      bills.splice(index, 1);
      saveBills();
      renderBills();
    });

    // Append buttons
    actions.appendChild(renameBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);

    // Append everything
    item.appendChild(previewElement);
    item.appendChild(namePara);
    item.appendChild(actions);
    billGallery.appendChild(item);
  });
}

// Handle file upload (multiple supported)
uploadBtn.addEventListener("click", function () {
  const files = Array.from(billInput.files);
  if (files.length === 0) return;

  let filesProcessed = 0;
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      bills.push({ name: file.name, data: e.target.result });
      filesProcessed++;
      if (filesProcessed === files.length) {
        saveBills();
        renderBills();
      }
    };
    reader.readAsDataURL(file);
  });

  // Clear input so same file can be uploaded again
  billInput.value = "";
});

// Lightbox functions
function openLightbox(index) {
  currentIndex = index;
  lightbox.style.display = "flex"; // show modal
  showBill(currentIndex);
}

function showBill(index) {
  const bill = bills[index];
  if (!bill) return;

  const isPDF = bill.name.toLowerCase().endsWith(".pdf");

  if (isPDF) {
    lightboxPdf.src = bill.data;
    lightboxPdf.style.display = "block";
    lightboxImg.style.display = "none";
  } else {
    lightboxImg.src = bill.data;
    lightboxImg.style.display = "block";
    lightboxPdf.style.display = "none";
  }
}

function closeLightbox() {
  lightbox.style.display = "none";
  lightboxImg.src = "";
  lightboxPdf.src = "";
}

// Navigation handlers
function prevBill() {
  currentIndex = (currentIndex - 1 + bills.length) % bills.length;
  showBill(currentIndex);
}

function nextBill() {
  currentIndex = (currentIndex + 1) % bills.length;
  showBill(currentIndex);
}

// Close on X
lightboxClose.addEventListener("click", closeLightbox);

// Close on background click
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Next/Prev arrow listeners
lightboxPrev.addEventListener("click", (e) => {
  e.stopPropagation();
  prevBill();
});
lightboxNext.addEventListener("click", (e) => {
  e.stopPropagation();
  nextBill();
});

// Initial render
renderBills();











