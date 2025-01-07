// Calculator object to manage state and functionality
const calculator = {
  // Reference to the calculator screen (div element)
  screen: document.querySelector("#screen"),
  // Reference to the container holding all calculator buttons
  keys: document.querySelector(".calculator-keys"),
  // Variables to store the operator, operands, and current value
  operator: null,
  firstOperand: null,
  waitingForSecondOperand: false,
  currentValue: "0",

  // Update the calculator screen
  updateScreen() {
    this.screen.textContent = this.currentValue;
  },

  // Handle button clicks
  handleKey(button) {
    const { value, classList } = button;

    if (classList.contains("operator")) {
      this.handleOperator(value);
    } else if (classList.contains("equal-sign")) {
      this.calculateResult();
    } else if (classList.contains("all-clear")) {
      this.resetCalculator();
    } else if (classList.contains("decimal")) {
      this.inputDecimal(value);
    } else {
      this.inputDigit(value);
    }

    this.updateScreen();
  },

  // Handle digit or decimal input
  inputDigit(digit) {
    if (this.waitingForSecondOperand) {
      this.currentValue = digit;
      this.waitingForSecondOperand = false;
    } else {
      this.currentValue =
        this.currentValue === "0" ? digit : this.currentValue + digit;
    }
  },

  inputDecimal(dot) {
    if (this.waitingForSecondOperand) {
      this.currentValue = "0.";
      this.waitingForSecondOperand = false;
      return;
    }

    if (!this.currentValue.includes(dot)) {
      this.currentValue += dot;
    }
  },

  // Handle operator input
  handleOperator(nextOperator) {
    if (this.firstOperand === null) {
      this.firstOperand = parseFloat(this.currentValue);
    } else if (this.operator) {
      const result = this.performCalculation(
        this.firstOperand,
        parseFloat(this.currentValue),
        this.operator
      );
      this.currentValue = `${result}`;
      this.firstOperand = result;
    }

    this.operator = nextOperator;
    this.waitingForSecondOperand = true;
  },

  // Perform the calculation
  performCalculation(firstOperand, secondOperand, operator) {
    switch (operator) {
      case "+":
        return firstOperand + secondOperand;
      case "-":
        return firstOperand - secondOperand;
      case "*":
        return firstOperand * secondOperand;
      case "/":
        return secondOperand !== 0 ? firstOperand / secondOperand : "Error";
      default:
        return secondOperand;
    }
  },

  // Handle the equal sign
  calculateResult() {
    if (this.operator && this.firstOperand !== null) {
      this.currentValue = `${this.performCalculation(
        this.firstOperand,
        parseFloat(this.currentValue),
        this.operator
      )}`;
      this.firstOperand = null;
      this.operator = null;
    }
    this.waitingForSecondOperand = false;
  },

  // Reset the calculator
  resetCalculator() {
    this.currentValue = "0";
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
  },
};

// Attach event listener to handle button clicks
calculator.keys.addEventListener("click", (event) => {
  const { target } = event;

  // Only process clicks on buttons
  if (!target.matches("button")) return;

  calculator.handleKey(target);
});
