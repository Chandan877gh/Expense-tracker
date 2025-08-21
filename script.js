// script.js

// Elements
const expenseForm = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const monthlySummary = document.getElementById("monthly-summary");
const expenseChartCanvas = document.getElementById("expense-chart");
const monthlyChartCanvas = document.getElementById("monthlyChart");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

// Chart instances
let expenseChart;
let monthlyChart;

// Save to localStorage
function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Add Expense
expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (!date || !category || !amount) return;

  const expense = { id: Date.now(), date, category, amount, note };
  expenses.push(expense);
  saveExpenses();
  renderExpenses();
  updateCharts();

  expenseForm.reset();
});

// Delete Expense
function deleteExpense(id) {
  expenses = expenses.filter(exp => exp.id !== id);
  saveExpenses();
  renderExpenses();
  updateCharts();
}

// Render Expenses Table
function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach(exp => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>${exp.amount.toFixed(2)}</td>
      <td>${exp.note || ""}</td>
      <td><button onclick="deleteExpense(${exp.id})">Delete</button></td>
    `;
    expenseList.appendChild(row);
  });
}

// Update Charts
function updateCharts() {
  // Category Summary (Pie Chart)
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const categories = Object.keys(categoryTotals);
  const amounts = Object.values(categoryTotals);

  if (expenseChart) expenseChart.destroy();
  expenseChart = new Chart(expenseChartCanvas, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{
        label: "Expenses by Category",
        data: amounts,
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
          "#9966FF", "#FF9F40", "#66FF66", "#FF6666"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Monthly Totals
  const monthlyTotals = {};
  expenses.forEach(exp => {
    const month = exp.date.slice(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
  });

  monthlySummary.innerHTML = "";
  for (const [month, total] of Object.entries(monthlyTotals)) {
    const li = document.createElement("li");
    li.textContent = `${month}: ${total.toFixed(2)}`;
    monthlySummary.appendChild(li);
  }

  // Monthly Chart (Bar)
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(monthlyChartCanvas, {
    type: "bar",
    data: {
      labels: Object.keys(monthlyTotals),
      datasets: [{
        label: "Monthly Totals",
        data: Object.values(monthlyTotals),
        backgroundColor: "#36A2EB"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Initial Render
renderExpenses();
updateCharts();
