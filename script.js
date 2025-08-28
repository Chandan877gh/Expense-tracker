// ================== EXPENSE TRACKER SCRIPT ==================

// Grab DOM elements
const form = document.getElementById("expense-form");
const ctx = document.getElementById("expense-chart").getContext("2d");
const monthlySummary = document.getElementById("monthly-summary");

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
      backgroundColor: ["#007FFF", "#FC5C8C", "#FF4500", "#32CD32", "#FFD700", "#8A2BE2"]
    }]
  },
  options: { responsive: true }
});

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
    updateChart();
    renderSummary();
  }
}

// Delete expense
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveExpenses();
  renderExpenses();
  updateChart();
  renderSummary();
}

// Update chart
function updateChart() {
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + Number(exp.amount);
  });

  expenseChart.data.labels = Object.keys(categoryTotals);
  expenseChart.data.datasets[0].data = Object.values(categoryTotals);
  expenseChart.update();
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
  updateChart();
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
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

// Initial render
renderExpenses();
updateChart();
renderSummary();

// ================== BILL GALLERY SCRIPT (with Lightbox + Navigation) ==================
// (keep your version from before, it’s fine!)
