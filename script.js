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

// ---- Capture bill feature ----
function renderExpenses() {
expenseList.innerHTML = "";
expenses.forEach((expense, index) => {
let row = document.createElement("tr");

row.innerHTML = `
     <td>${expense.date}</td>
     <td>${expense.category}</td>
     <td>₹${expense.amount}</td>
     <td>${expense.note}</td>
     <td>
       ${expense.photo 
         ? `
           <a href="${expense.photo}" download="bill-${index}.png">📥 Download</a>
           <button onclick="removePhoto(${index})">🗑 Remove</button>
         `
         : `<input type="file" accept="image/*" onchange="uploadPhoto(event, ${index})">`
       }
     </td>
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
updateMonthlySummary();
localStorage.setItem("expenses", JSON.stringify(expenses));
}

function uploadPhoto(event, index) {
let file = event.target.files[0];
if (!file) return;

let reader = new FileReader();
reader.onload = function(e) {
expenses[index].photo = e.target.result; // save base64 image
localStorage.setItem("expenses", JSON.stringify(expenses));
renderExpenses();
};
reader.readAsDataURL(file);
}

function removePhoto(index) {
expenses[index].photo = null;
localStorage.setItem("expenses", JSON.stringify(expenses));
renderExpenses();
}

// ---- Edit feature ----
document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseTableBody = document.querySelector("#expense-table tbody");
  const totalAmountEl = document.getElementById("total-amount");
  const monthTotalEl = document.getElementById("month-total");

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  let editingIndex = null; // track which row is being edited

  renderExpenses();

  // Add Expense
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const note = document.getElementById("note").value;

    if (!date || !category || !amount) return;

    if (editingIndex !== null) {
      // update existing
      expenses[editingIndex] = { date, category, amount, note };
      editingIndex = null;
    } else {
      // add new
      expenses.push({ date, category, amount, note });
    }

    localStorage.setItem("expenses", JSON.stringify(expenses));
    expenseForm.reset();
    renderExpenses();
  });

  // Render expenses
  function renderExpenses() {
    expenseTableBody.innerHTML = "";
    let total = 0;
    let monthTotal = 0;
    const currentMonth = new Date().getMonth();

    expenses.forEach((expense, index) => {
      total += expense.amount;
      if (new Date(expense.date).getMonth() === currentMonth) {
        monthTotal += expense.amount;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${expense.date}</td>
        <td>${expense.category}</td>
        <td>${expense.amount.toFixed(2)}</td>
        <td>${expense.note}</td>
        <td>
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
        </td>
      `;
      expenseTableBody.appendChild(row);
    });

    totalAmountEl.textContent = total.toFixed(2);
    monthTotalEl.textContent = monthTotal.toFixed(2);
  }

  // Handle Edit and Delete buttons
  expenseTableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.dataset.index;
      expenses.splice(index, 1);
      localStorage.setItem("expenses", JSON.stringify(expenses));
      renderExpenses();
    }

    if (e.target.classList.contains("edit-btn")) {
      const index = e.target.dataset.index;
      const expense = expenses[index];

      document.getElementById("date").value = expense.date;
      document.getElementById("category").value = expense.category;
      document.getElementById("amount").value = expense.amount;
      document.getElementById("note").value = expense.note;

      editingIndex = index;

      // Show Cancel button only during edit
      let cancelBtn = document.getElementById("cancel-btn");
      if (!cancelBtn) {
        cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.id = "cancel-btn";
        cancelBtn.type = "button";
        expenseForm.appendChild(cancelBtn);

        cancelBtn.addEventListener("click", () => {
          expenseForm.reset();
          editingIndex = null;
          cancelBtn.remove();
        });
      }
    }
  });
});






