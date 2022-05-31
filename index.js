/**
 * Elements
 */
const transactionBtn = document.querySelector(".transaction-btn");
const deleteBtn = document.querySelector(".delete-btn");
const categoryInput = document.querySelector("#category");
const nameInput = document.querySelector("#name");
const amountInput = document.querySelector("#amount");
const incomeTag = document.querySelector(".income p");
const expenseTag = document.querySelector(".expense p");
const historyContainer = document.querySelector(".history-container");
const chartContainer = document.querySelector(".chart-container");
const categoryContainer = document.querySelector(".category-container");

const TRANSACTION_KEY = "transactions";

class Transaction {
  constructor(category, name, amount) {
    this.id = Tracker.uuid();
    this.category = category;
    this.name = name;
    this.amount = amount;
  }
}

class Tracker {
  constructor() {
    this.transactions = [];
    this.category = {
      grocery: 0,
      restaurant: 0,
      transit: 0,
      car: 0,
      home: 0,
      other: 0,
    };
    this.balance = 0;
    this.income = 0;
    this.expense = 0;
    this.chart = null;
  }

  static uuid = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

  addTransaction = (transaction) => {
    this.transactions.push(transaction);
    this.calculateBalance(transaction);
    this.updateUI();
    this.updateLocalStorage();
  };

  deleteTransaction = (transaction) => {
    this.transactions = this.transactions.filter(
      (t) => t.id !== transaction.id
    );
    this.calculateBalance(transaction, true);
    this.updateUI();
    this.updateLocalStorage();
  };

  findTransaction = (id) => {
    return this.transactions.find((t) => t.id === id);
  };

  calculateBalance = (transaction, isRemove = false) => {
    if (isRemove) {
      if (transaction.category === "income") {
        this.income -= transaction.amount;
        this.balance -= transaction.amount;
      } else {
        this.expense -= transaction.amount;
        this.balance += transaction.amount;
        this.category[transaction.category] -= transaction.amount;
      }
    } else {
      if (transaction.category === "income") {
        this.income += transaction.amount;
        this.balance += transaction.amount;
      } else {
        this.expense += transaction.amount;
        this.balance -= transaction.amount;
        this.category[transaction.category] += transaction.amount;
      }
    }
  };

  updateUI = () => {
    incomeTag.innerHTML = this.income.toFixed(2);
    expenseTag.innerHTML = this.expense.toFixed(2);

    historyContainer.innerHTML = "";

    if (this.transactions.length > 0) {
      const histories = this.transactions.map(
        (t) =>
          `
			  <div class="flex history">
				  <p class="flex-1 text-center">${t.name}</p>
				  <p class="flex-2 text-center">${t.amount}</p>
				  <button class="common-btn delete-btn ${t.id}">
					  <i class="fa-solid fa-trash"></i>
				  </button>
			  </div>
			`
      );
      for (let i = 1; i < histories.length + 1; i++) {
        if (histories.at(-i)) {
          historyContainer.innerHTML += histories.at(-i);
        }
      }
    }
    if (this.chart) {
      this.chart.destroy();
    }
    this.generateChart();
    this.generateCategory();
  };

  initUI = () => {
    this.loadLocalStorage();
    this.generateCategory();

    if (this.transactions.length === 0) {
      chartContainer.innerHTML =
        "<p class='no-transaction'>Please add new transaction.</p>";
    } else {
      chartContainer.innerHTML = "<canvas id='chart'></canvas>";

      this.transactions.forEach((t) => {
        if (t.category === "income") {
          this.income += t.amount;
          this.balance += t.amount;
        } else {
          this.expense += t.amount;
          this.balance -= t.amount;
        }

        this.category[t.category] += t.amount;
      });
      this.generateChart();
      this.updateUI();
    }
  };

  loadLocalStorage = () => {
    if (TRANSACTION_KEY in localStorage) {
      const transactions = JSON.parse(localStorage.getItem(TRANSACTION_KEY));
      this.transactions = transactions;
    }
  };

  updateLocalStorage = () => {
    localStorage.setItem(TRANSACTION_KEY, JSON.stringify(this.transactions));
  };

  generateCategory = () => {
    let str = "";

    for (let key in this.category) {
      if (key === "income") continue;

      str += `
		  <div class="category-item category-${key}">
			<p>${key}</p>
			<p class="category-${key}-amount">${this.category[key]}</p>
		</div>`;
    }

    categoryContainer.innerHTML = str;
  };

  generateChart = () => {
    if (this.transactions.length === 0) {
      if (this.chart) {
        this.chart.destroy();
      }
      chartContainer.innerHTML =
        "<p class='no-transaction'>Please add new transaction.</p>";
      return;
    } else {
      chartContainer.innerHTML = "<canvas id='chart'></canvas>";
      const { grocery, restaurant, transit, car, home, other } = this.category;
      const data = {
        labels: ["Grocery", "Restaurant", "Transit", "Car", "Home", "Other"],
        datasets: [
          {
            label: "Expense Concur",
            data: [grocery, restaurant, transit, car, home, other],
            backgroundColor: [
              "#FFADAD",
              "#FFD6A5",
              "#CAFFBF",
              "#98F6FF",
              "#BDB2FF",
              "#FDFFB6",
            ],
          },
        ],
      };

      const config = {
        type: "doughnut",
        data: data,
        options: {
          cutout: 130,
        },
        plugins: [
          {
            id: "text",
            beforeDraw: (chart, a, b) => {
              const {
                ctx,
                chartArea: { left, right, top, bottom, width, height },
              } = chart;

              ctx.restore();
              ctx.textBaseline = "middle";
              ctx.font = "bold 30px Montserrat";

              if (this.balance >= 0) {
                ctx.fillStyle = "#018749";
              } else {
                ctx.fillStyle = "#dc143c";
              }

              const text = this.balance.toFixed(2);
              const textX = Math.round(
                (width - ctx.measureText(text).width) / 2
              );
              const textY = height / 2 + top;

              ctx.fillText(text < 0 ? text.slice(1) : text, textX, textY);
              ctx.save();
            },
          },
        ],
      };

      this.chart = new Chart(document.getElementById("chart"), config);
    }
  };
}

const tracker = new Tracker();

/**
 * Events
 */
window.addEventListener("load", () => {
  tracker.initUI();
});

transactionBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const category = categoryInput.value;
  const name = nameInput.value;
  const amount = amountInput.value;

  if (!name || !amount) {
    alert("Name and Amount are required.");
    return;
  }

  if (isNaN(amount) || amount.match(/[^0-9.]/) || amount < 0) {
    alert("Amount must be number and higher than 0.");
    return;
  }

  nameInput.value = "";
  amountInput.value = "";

  const newTransaction = new Transaction(category, name, parseFloat(amount));
  tracker.addTransaction(newTransaction);
});

document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("fa-trash")) {
    parentBtn = e.target.parentNode;
    id = parentBtn.classList[parentBtn.classList.length - 1];

    const transaction = tracker.findTransaction(id);
    tracker.deleteTransaction(transaction);
  }
});
