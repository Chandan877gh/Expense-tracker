// Grab DOM elements
const form = document.getElementById("expense-form");
const expenseList = document.getElementById("expense-list");
const ctx = document.getElementById("expense-chart").getContext("2d");
const monthlySummary = document.getElementById("monthly-summary"); // ✅ new

// 🔍 New selectors for search & filter
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

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
      <td><button class="delete-btn" data-index="${index}">Delete</button></td>
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
  updateMonthlySummary(); // ✅ update monthly summary too
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

// ✅ Update monthly summary
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

// ========== Filter & Search Feature ==========
// Re-render filtered expenses
function renderFilteredExpenses() {
  const searchValue = searchInput.value.toLowerCase();
  const categoryValue = categoryFilter.value;

  expenseList.innerHTML = '';

  let filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchValue);
    const matchesCategory = categoryValue ? expense.category === categoryValue : true;
    return matchesSearch && matchesCategory;
  });

  filteredExpenses.forEach(expense => {
    const li = document.createElement('li');
    li.textContent = `${expense.date} - ${expense.description} - ₹${expense.amount} (${expense.category})`;
    expenseList.appendChild(li);
  });
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

// Listen to search & filter changes
searchInput.addEventListener('input', renderFilteredExpenses);
categoryFilter.addEventListener('change', renderFilteredExpenses);

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












