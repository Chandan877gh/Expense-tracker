// Grab DOM elements
const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const ctx = document.getElementById("expense-chart").getContext("2d");

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
  expenses.forEach(exp => {
    let row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.category}</td>
      <td>₹${exp.amount}</td>
      <td>${exp.note}</td>
    `;
    expenseList.appendChild(row);
  });
  updateChart();
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
