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

// ---- Capture bill feature ----
// Function to add a new expense row
function addExpenseRow(date, category, amount, note) {
  const tableBody = document.getElementById("expense-list");
  const row = document.createElement("tr");

  // Date
  const dateCell = document.createElement("td");
  dateCell.textContent = date;
  row.appendChild(dateCell);

  // Category
  const categoryCell = document.createElement("td");
  categoryCell.textContent = category;
  row.appendChild(categoryCell);

  // Amount
  const amountCell = document.createElement("td");
  amountCell.textContent = amount;
  row.appendChild(amountCell);

  // Note
  const noteCell = document.createElement("td");
  noteCell.textContent = note;
  row.appendChild(noteCell);

  // Action (Delete button)
  const actionCell = document.createElement("td");
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = function () {
    row.remove();
  };

  actionCell.appendChild(deleteBtn);
  row.appendChild(actionCell);

  // Bill Upload
  const billCell = document.createElement("td");
  const billLabel = document.createElement("label");
  billLabel.textContent = "Upload";
  billLabel.style.cursor = "pointer";
  billLabel.style.color = "blue";

  const billInput = document.createElement("input");
  billInput.type = "file";
  billInput.className = "bill-upload";
  billInput.accept = "image/*";
  billInput.setAttribute("capture", "environment");
  billInput.style.display = "none"; // hide raw file input

  // When label is clicked, trigger file input
  billLabel.onclick = () => billInput.click();

  billCell.appendChild(billLabel);
  billCell.appendChild(billInput);
  row.appendChild(billCell);

  // Add row to table
  tableBody.appendChild(row);
}






























