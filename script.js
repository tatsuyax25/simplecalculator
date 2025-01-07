// Calculator object to manage state and functionality
const calculator = {
  screen: document.querySelector('#screen'), // Reference to the calculator screen
  keys: documents.querySelector('.calculator-keys'), // Reference to calculator buttons
  operator: null, // Current operator
  firstOperand: null, // First operand
  waitingForSecondOperand: false, // Flag to track second operand input
  currentValue: '0', // Current display value

  // Update the calculator screen with the current value
  updateScreen() {
    this.screen.value = this.currentValue;
  },

  // Handle button clicks
  handleKey(button) {
    const { value, classList } = button;

    if (classList.contains('operator')) {
      this.handleOperator(value);
    } else if (classList.contains('equal-sign')) {
      this.calculateResult();
    } else if (classList.contains('all-clear')) {
      this.resetCalculator();
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
      this.currentValue = this.currentValue === '0' ? digit : this.currentValue + digit;
    }
  },

  // Handle operator input
  handleOperator(nextOperator) {
    if (this.firstOperand === null) {
      this.firstOperand = parseFloat(this.currentValue);
    } else if (this.operator && !this.waitingForSecondOperand) {
      const result = this.performCalculation(this.firstOperand, parseFloat(this.currentValue), this.operator);
      this.currentValue = `${result}`;
      this.firstOperand = result;
    }

    this.operator = nextOperator;
    this.waitingForSecondOperand = true;
  },

  // Perform calculations based on the operator
  performCalculation(firstOperand, secondOperand, operator) {
    switch (operator) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return secondOperand !== 0 ? firstOperand / secondOperand : 'Error';
      default:
        return secondOperand;
    }
  },
  
  // Handle the equal sign button
  calculateResult() {
    if (this.operator && !this.waitingForSecondOperand) {
      this.currentValue = `${this.performCalculation(this.firstOperand, parseFloat(this.currentValue), this.operator)}`;
      this.firstOperand = null;
      this.operator = null;
    }
    this.waitingForSecondOperand = false;
  },

  // Reset the calculator
  resetCalculator() {
    this.currentValue = '0';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
  }
};