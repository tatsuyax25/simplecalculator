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
}