// Grab DOM elements
const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const ctx = document.getElementById("expense-chart").getContext("2d");
const monthlySummary = document.getElementById("monthly-summary"); // new

// Load expenses from localStorage or start empty
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Initialize chart
let expenseChart = new Chart(ctx, {
type: "pie",
data: {
labels: [],
datasets: [{
label: "Expenses",
data: [],
backgroundColor: [
"#007FFF", "#FC5C8C", "#FF4500", "#32CD32", "#FFD700", "#8A2BE2"
]
}]
},
options: {
responsive: true
}
});

// Save to localStorage
function saveExpenses() {
localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Render expense list
function renderExpenses() {
expenseList.innerHTML = "";
expenses.forEach((exp, index) => {
let row = document.createElement("tr");
row.innerHTML = `
     <td>${exp.date}</td>
     <td>${exp.category}</td>
     <td>₹${exp.amount}</td>
     <td>${exp.note}</td>
   `;
expenseList.appendChild(row);
});

// Add delete button events
document.querySelectorAll(".delete-btn").forEach(btn => {
btn.addEventListener("click", (e) => {
let index = e.target.getAttribute("data-index");
expenses.splice(index, 1); // remove expense
saveExpenses();
renderExpenses(); // re-render after delete
});
});

updateChart();
updateMonthlySummary(); // update monthly summary too
}

// Update chart with totals by category
function updateChart() {
let categoryTotals = {};
expenses.forEach(exp => {
categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + parseFloat(exp.amount);
});

expenseChart.data.labels = Object.keys(categoryTotals);
expenseChart.data.datasets[0].data = Object.values(categoryTotals);
expenseChart.update();
}

// Update monthly summary
function updateMonthlySummary() {
let monthlyTotals = {};

expenses.forEach(exp => {
let month = exp.date.slice(0, 7); // YYYY-MM
monthlyTotals[month] = (monthlyTotals[month] || 0) + parseFloat(exp.amount);
});

monthlySummary.innerHTML = "";
for (let [month, total] of Object.entries(monthlyTotals)) {
let li = document.createElement("li");
li.textContent = `${month}: ₹${total.toFixed(2)}`;
monthlySummary.appendChild(li);
}
}

// Handle form submit
form.addEventListener("submit", (e) => {
e.preventDefault();

const expense = {
date: document.getElementById("date").value,
category: document.getElementById("category").value,
amount: document.getElementById("amount").value,
note: document.getElementById("note").value
};

expenses.push(expense);
saveExpenses();
renderExpenses();

form.reset();
});

// Initial render
renderExpenses();

// ---------------- Existing Code ----------------

// ---- Export CSV Feature ----
document.getElementById("exportBtn").addEventListener("click", function() {
let table = document.getElementById("expenseTable");
let rows = table.querySelectorAll("tr");
let csvContent = "";

rows.forEach((row, rowIndex) => {
let cols = row.querySelectorAll("th, td"); // include headers too
let rowData = [];

// Skip the last column (Action/Delete button)
cols.forEach((col, colIndex) => {
if (colIndex < cols.length - 1) {
let text = col.innerText.trim();

// If it's the Amount column (3rd column, index = 2), strip symbols
if (rowIndex > 0 && colIndex === 2) {
text = text.replace(/[^0-9.-]+/g, ""); 
// removes everything except digits, minus, and dot
}

rowData.push(text);
}
});

csvContent += rowData.join(",") + "\n";
});

// Create downloadable file
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
let text = row.innerText.toLowerCase();  // Check whole row (date, category, description, amount)
if (text.includes(filter)) {
row.style.display = "";
} else {
row.style.display = "none";
}
});
});
     
// ---- Edit & Delete Feature (Unified with script.js) ----
document.getElementById("expense-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    expenses.push({ date, category, amount, note });
    localStorage.setItem("expenses", JSON.stringify(expenses));

    this.reset();
    renderExpenses();
    updateChart();
    renderSummary();
});

function renderExpenses() {
    const tableBody = document.getElementById("expenseTable");
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
     
function editExpense(index, btn) {
    const row = btn.closest("tr");
    const exp = expenses[index];

    if (btn.textContent === "Edit") {
        // Change cells into input fields
        row.cells[0].innerHTML = `<input type="date" value="${exp.date}">`;
        row.cells[1].innerHTML = `<input type="text" value="${exp.category}">`;
        row.cells[2].innerHTML = `<input type="number" value="${exp.amount}" step="0.01">`;
        row.cells[3].innerHTML = `<input type="text" value="${exp.note}">`;
        btn.textContent = "Save";
    } else {
        // Save updated values
        const newDate = row.cells[0].querySelector("input").value;
        const newCategory = row.cells[1].querySelector("input").value;
        const newAmount = parseFloat(row.cells[2].querySelector("input").value);
        const newNote = row.cells[3].querySelector("input").value;

        expenses[index] = { date: newDate, category: newCategory, amount: newAmount, note: newNote };
        localStorage.setItem("expenses", JSON.stringify(expenses));

        btn.textContent = "Edit";
        renderExpenses();
        updateChart();
        renderSummary();
    }
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    renderExpenses();
    updateChart();
    renderSummary();
}

function renderSummary() {
    const summaryDiv = document.getElementById("monthly-summary");
    summaryDiv.innerHTML = "";

    const monthlyTotals = {};

    expenses.forEach(exp => {
        const month = exp.date.slice(0, 7); // "YYYY-MM"
        if (!monthlyTotals[month]) {
            monthlyTotals[month] = 0;
        }
        monthlyTotals[month] += Number(exp.amount);
    });

    for (const month in monthlyTotals) {
        const p = document.createElement("p");
        p.textContent = `${month}: ₹${monthlyTotals[month].toFixed(2)}`;
        summaryDiv.appendChild(p);
    }
}

// Initial render
renderExpenses();
updateChart();
renderSummary();

// Tab switching
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Remove active class from all
    tabButtons.forEach(btn => btn.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"));

    // Add to clicked tab
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

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



















































