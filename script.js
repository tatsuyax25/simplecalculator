// Enhanced Calculator object with improved functionality
const calculator = {
  // DOM References
  screen: document.querySelector("#screen"),
  keys: document.querySelector(".calculator-keys"),
  
  // Core calculation state
  operator: null,
  firstOperand: null,
  waitingForSecondOperand: false,
  currentValue: "0",
  
  // Memory functionality - stores a number for later recall
  memory: 0,
  
  // History functionality - stores recent calculations
  history: [],
  maxHistorySize: 10, // Limit history to prevent memory issues
  
  // Constants for better error handling and formatting
  MAX_DIGITS: 12, // Maximum digits to display
  ERROR_MESSAGES: {
    DIVISION_BY_ZERO: "Cannot divide by zero",
    OVERFLOW: "Number too large",
    INVALID: "Invalid operation"
  },

  // Enhanced screen update with animations and visual feedback
  updateScreen() {
    let displayValue = this.currentValue;
    
    // Handle error messages - display as-is with error styling
    if (typeof displayValue === 'string' && displayValue.includes('Cannot')) {
      this.updateScreenText(displayValue);
      this.addScreenFlash('error'); // Visual feedback for errors
      return;
    }
    
    // Convert to number for formatting
    const numValue = parseFloat(displayValue);
    
    // Handle very large numbers with scientific notation
    if (Math.abs(numValue) >= Math.pow(10, this.MAX_DIGITS)) {
      displayValue = numValue.toExponential(6);
    }
    // Handle very small numbers (close to zero but not zero)
    else if (Math.abs(numValue) < 0.000001 && numValue !== 0) {
      displayValue = numValue.toExponential(6);
    }
    // Handle normal numbers - limit decimal places if too long
    else if (displayValue.length > this.MAX_DIGITS) {
      displayValue = numValue.toPrecision(this.MAX_DIGITS);
    }
    
    this.updateScreenText(displayValue);
  },
  
  // NEW: Update screen text with smooth animation
  updateScreenText(text) {
    const screenText = this.screen.querySelector('.screen-text') || this.screen;
    
    // Add fade animation for smooth text changes
    screenText.style.opacity = '0.7';
    
    setTimeout(() => {
      screenText.textContent = text;
      screenText.style.opacity = '1';
    }, 100);
  },
  
  // NEW: Add visual flash effect to screen
  addScreenFlash(type = 'normal') {
    const flash = document.getElementById('screen-flash');
    if (!flash) return;
    
    // Different flash colors for different actions
    if (type === 'error') {
      flash.style.background = 'rgba(255, 0, 0, 0.2)';
    } else if (type === 'result') {
      flash.style.background = 'rgba(0, 255, 0, 0.2)';
    } else {
      flash.style.background = 'rgba(255, 255, 255, 0.1)';
    }
    
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 150);
  },

  // Enhanced button click handler with visual and audio feedback
  handleKey(button) {
    const { value, classList } = button;
    
    // Add visual feedback effects
    this.addButtonRipple(button);
    this.playClickSound(classList);
    this.addScreenFlash();

    // Handle different button types
    if (classList.contains("operator")) {
      this.handleOperator(value);
    } else if (classList.contains("equal-sign")) {
      this.calculateResult();
      this.addScreenFlash('result'); // Special flash for results
    } else if (classList.contains("all-clear")) {
      this.resetCalculator();
    } else if (classList.contains("decimal")) {
      this.inputDecimal(value);
    } else if (classList.contains("backspace")) {
      this.handleBackspace();
    } else if (classList.contains("memory")) {
      this.handleMemory(value);
    } else {
      this.inputDigit(value);
    }

    this.updateScreen();
  },
  
  // NEW: Add ripple effect to buttons for modern touch feedback
  addButtonRipple(button) {
    // Don't add ripple if reduced motion is preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    
    button.classList.add('ripple');
    
    // Remove ripple class after animation
    setTimeout(() => {
      button.classList.remove('ripple');
    }, 300);
  },
  
  // NEW: Play different sounds for different button types
  playClickSound(classList) {
    // Only play sounds if user hasn't disabled them
    if (this.soundEnabled === false) return;
    
    try {
      // Create audio context for Web Audio API (more reliable than HTML5 audio)
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Different frequencies for different button types
      let frequency = 800; // Default frequency
      
      if (classList.contains('operator')) {
        frequency = 600; // Lower tone for operators
      } else if (classList.contains('equal-sign')) {
        frequency = 1000; // Higher tone for equals
      } else if (classList.contains('all-clear')) {
        frequency = 400; // Lowest tone for clear
      } else if (classList.contains('memory')) {
        frequency = 700; // Medium tone for memory functions
      }
      
      // Generate and play the sound
      this.generateBeep(frequency, 0.1, 0.05); // frequency, duration, volume
      
    } catch (error) {
      // Silently fail if audio is not supported
      console.log('Audio not supported:', error);
      this.soundEnabled = false;
    }
  },
  
  // NEW: Generate beep sound using Web Audio API
  generateBeep(frequency, duration, volume) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine'; // Smooth sine wave
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  },

  // Enhanced digit input with overflow protection
  inputDigit(digit) {
    // Clear error messages when starting new input
    if (this.isError(this.currentValue)) {
      this.currentValue = "0";
    }
    
    if (this.waitingForSecondOperand) {
      this.currentValue = digit;
      this.waitingForSecondOperand = false;
    } else {
      // Prevent input if display would be too long
      if (this.currentValue.length >= this.MAX_DIGITS) {
        return; // Ignore additional digits
      }
      
      this.currentValue =
        this.currentValue === "0" ? digit : this.currentValue + digit;
    }
  },

  // Enhanced decimal input with validation
  inputDecimal(dot) {
    // Clear error messages when starting new input
    if (this.isError(this.currentValue)) {
      this.currentValue = "0";
    }
    
    if (this.waitingForSecondOperand) {
      this.currentValue = "0.";
      this.waitingForSecondOperand = false;
      return;
    }

    // Only add decimal if none exists and we have room
    if (!this.currentValue.includes(dot) && this.currentValue.length < this.MAX_DIGITS) {
      this.currentValue += dot;
    }
  },

  // Enhanced operator handling with error checking
  handleOperator(nextOperator) {
    // Don't process operators if we have an error
    if (this.isError(this.currentValue)) {
      return;
    }
    
    const inputValue = parseFloat(this.currentValue);
    
    if (this.firstOperand === null) {
      this.firstOperand = inputValue;
    } else if (this.operator) {
      const result = this.performCalculation(
        this.firstOperand,
        inputValue,
        this.operator
      );
      
      // Handle calculation errors
      if (this.isError(result)) {
        this.currentValue = result;
        this.resetCalculatorState();
        return;
      }
      
      this.currentValue = `${result}`;
      this.firstOperand = result;
    }

    this.operator = nextOperator;
    this.waitingForSecondOperand = true;
  },

  // Enhanced calculation with comprehensive error handling and precision fixes
  performCalculation(firstOperand, secondOperand, operator) {
    let result;
    
    // Validate inputs
    if (isNaN(firstOperand) || isNaN(secondOperand)) {
      return this.ERROR_MESSAGES.INVALID;
    }
    
    switch (operator) {
      case "+":
        result = firstOperand + secondOperand;
        break;
      case "-":
        result = firstOperand - secondOperand;
        break;
      case "*":
        result = firstOperand * secondOperand;
        break;
      case "/":
        // Enhanced division by zero checking
        if (secondOperand === 0) {
          return this.ERROR_MESSAGES.DIVISION_BY_ZERO;
        }
        result = firstOperand / secondOperand;
        break;
      default:
        return secondOperand;
    }
    
    // Check for overflow or invalid results
    if (!isFinite(result)) {
      return this.ERROR_MESSAGES.OVERFLOW;
    }
    
    // Fix floating point precision issues (e.g., 0.1 + 0.2 = 0.30000000000000004)
    // Round to 10 decimal places to eliminate floating point errors
    result = Math.round(result * 10000000000) / 10000000000;
    
    return result;
  },

  // Enhanced result calculation with history tracking
  calculateResult() {
    if (this.operator && this.firstOperand !== null && !this.isError(this.currentValue)) {
      const secondOperand = parseFloat(this.currentValue);
      const result = this.performCalculation(
        this.firstOperand,
        secondOperand,
        this.operator
      );
      
      // Add to history before updating current value (only if not an error)
      if (!this.isError(result)) {
        this.addToHistory(this.firstOperand, this.operator, secondOperand, result);
      }
      
      this.currentValue = `${result}`;
      this.firstOperand = null;
      this.operator = null;
    }
    this.waitingForSecondOperand = false;
  },

  // Enhanced calculator reset with visual feedback
  resetCalculator() {
    this.currentValue = "0";
    this.resetCalculatorState();
    
    // Add visual feedback for reset action
    this.addScreenFlash();
  },
  
  // Reset calculation state (used internally)
  resetCalculatorState() {
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
  },
  
  // NEW FUNCTIONALITY: Backspace - removes last entered digit
  handleBackspace() {
    // Can't backspace from error messages
    if (this.isError(this.currentValue)) {
      return;
    }
    
    // If waiting for second operand, just clear current value
    if (this.waitingForSecondOperand) {
      this.currentValue = "0";
      return;
    }
    
    // Remove last character, or set to "0" if string becomes empty
    if (this.currentValue.length > 1) {
      this.currentValue = this.currentValue.slice(0, -1);
    } else {
      this.currentValue = "0";
    }
  },
  
  // NEW FUNCTIONALITY: Memory functions (MS, MR, MC, M+, M-)
  handleMemory(operation) {
    const currentNum = parseFloat(this.currentValue);
    
    // Don't process memory operations on errors
    if (this.isError(this.currentValue)) {
      return;
    }
    
    switch (operation) {
      case "MS": // Memory Store - save current value to memory
        this.memory = currentNum;
        break;
      case "MR": // Memory Recall - display memory value
        this.currentValue = this.memory.toString();
        this.waitingForSecondOperand = false;
        break;
      case "MC": // Memory Clear - clear memory
        this.memory = 0;
        break;
      case "M+": // Memory Add - add current value to memory
        this.memory += currentNum;
        break;
      case "M-": // Memory Subtract - subtract current value from memory
        this.memory -= currentNum;
        break;
    }
  },
  
  // NEW FUNCTIONALITY: History management
  addToHistory(first, operator, second, result) {
    const calculation = {
      expression: `${first} ${operator} ${second}`,
      result: result,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Add to beginning of history array
    this.history.unshift(calculation);
    
    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
    
    // Log to console for debugging (can be removed in production)
    console.log('Calculation added to history:', calculation);
  },
  
  // Get calculation history (useful for future UI features)
  getHistory() {
    return this.history;
  },
  
  // Clear calculation history
  clearHistory() {
    this.history = [];
  },
  
  // Utility function to check if a value is an error message
  isError(value) {
    return typeof value === 'string' && 
           (value.includes('Cannot') || value.includes('too large') || value.includes('Invalid'));
  },
  
  // NEW: Initialize UI preferences and settings
  initializeUI() {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('calculator-theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      this.updateThemeIcon(true);
    }
    
    // Load sound preference (default: enabled)
    this.soundEnabled = localStorage.getItem('calculator-sound') !== 'false';
    
    // Initialize audio context on first user interaction (required by browsers)
    this.audioContext = null;
    
    // Set up theme toggle functionality
    this.setupThemeToggle();
    
    // Initialize screen with proper structure
    this.initializeScreen();
  },
  
  // NEW: Set up theme toggle button functionality
  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-theme');
      
      // Save preference
      localStorage.setItem('calculator-theme', isDark ? 'dark' : 'light');
      
      // Update icon
      this.updateThemeIcon(isDark);
      
      // Add visual feedback
      this.addButtonRipple(themeToggle);
      
      // Play sound feedback
      if (this.soundEnabled) {
        this.generateBeep(500, 0.1, 0.03);
      }
    });
  },
  
  // NEW: Update theme toggle icon
  updateThemeIcon(isDark) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = isDark ? '☀️' : '🌙';
    }
  },
  
  // NEW: Initialize screen structure for animations
  initializeScreen() {
    const screen = this.screen;
    if (!screen.querySelector('.screen-text')) {
      const currentText = screen.textContent;
      screen.innerHTML = `<span class="screen-text">${currentText}</span>`;
    }
  },
  
  // NEW: Toggle sound on/off (can be called from console)
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('calculator-sound', this.soundEnabled.toString());
    console.log(`Sound ${this.soundEnabled ? 'enabled' : 'disabled'}`);
    
    // Play confirmation sound if enabling
    if (this.soundEnabled) {
      setTimeout(() => this.generateBeep(800, 0.2, 0.05), 100);
    }
  },
};

// Enhanced event listeners for both mouse clicks and keyboard input

// Handle button clicks (existing functionality)
calculator.keys.addEventListener("click", (event) => {
  const { target } = event;

  // Only process clicks on buttons
  if (!target.matches("button")) return;

  calculator.handleKey(target);
});

// NEW FUNCTIONALITY: Comprehensive keyboard support
document.addEventListener("keydown", (event) => {
  // Prevent default behavior for calculator keys to avoid page scrolling, etc.
  const calculatorKeys = ['0','1','2','3','4','5','6','7','8','9','+','-','*','/','=','Enter','Escape','Backspace','.','Delete'];
  if (calculatorKeys.includes(event.key)) {
    event.preventDefault();
  }
  
  // Create a virtual button object to reuse existing handleKey logic
  let virtualButton = { value: '', classList: { contains: () => false } };
  
  // Map keyboard keys to calculator functions
  switch (event.key) {
    // Number keys (0-9)
    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
      virtualButton.value = event.key;
      break;
      
    // Operator keys
    case '+':
      virtualButton.value = '+';
      virtualButton.classList.contains = (className) => className === 'operator';
      break;
    case '-':
      virtualButton.value = '-';
      virtualButton.classList.contains = (className) => className === 'operator';
      break;
    case '*':
      virtualButton.value = '*';
      virtualButton.classList.contains = (className) => className === 'operator';
      break;
    case '/':
      virtualButton.value = '/';
      virtualButton.classList.contains = (className) => className === 'operator';
      break;
      
    // Equals key (Enter or =)
    case '=':
    case 'Enter':
      virtualButton.value = '=';
      virtualButton.classList.contains = (className) => className === 'equal-sign';
      break;
      
    // Clear key (Escape or Delete)
    case 'Escape':
    case 'Delete':
      virtualButton.value = 'all-clear';
      virtualButton.classList.contains = (className) => className === 'all-clear';
      break;
      
    // Backspace key
    case 'Backspace':
      virtualButton.value = 'backspace';
      virtualButton.classList.contains = (className) => className === 'backspace';
      break;
      
    // Decimal point
    case '.':
      virtualButton.value = '.';
      virtualButton.classList.contains = (className) => className === 'decimal';
      break;
      
    // Memory functions (for future use)
    case 'm': // Memory store
      if (event.ctrlKey || event.metaKey) {
        virtualButton.value = 'MS';
        virtualButton.classList.contains = (className) => className === 'memory';
      } else {
        return; // Don't process regular 'm' key
      }
      break;
    case 'r': // Memory recall
      if (event.ctrlKey || event.metaKey) {
        virtualButton.value = 'MR';
        virtualButton.classList.contains = (className) => className === 'memory';
      } else {
        return; // Don't process regular 'r' key
      }
      break;
      
    default:
      return; // Don't process other keys
  }
  
  // Process the virtual button press
  calculator.handleKey(virtualButton);
});

// Initialize calculator with enhanced UI features
document.addEventListener('DOMContentLoaded', () => {
  calculator.initializeUI();
  calculator.updateScreen();
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded
  calculator.initializeUI();
  calculator.updateScreen();
}

// Enhanced utility functions for debugging and user control

// Display calculation history (call in browser console)
calculator.showHistory = function() {
  console.log('=== Calculator History ===');
  if (this.history.length === 0) {
    console.log('No calculations yet.');
    return;
  }
  
  this.history.forEach((calc, index) => {
    console.log(`${index + 1}. ${calc.expression} = ${calc.result} (${calc.timestamp})`);
  });
  console.log(`Memory: ${this.memory}`);
  console.log(`Theme: ${document.body.classList.contains('dark-theme') ? 'Dark' : 'Light'}`);
  console.log(`Sound: ${this.soundEnabled ? 'Enabled' : 'Disabled'}`);
};

// Quick access functions for users (call in browser console)
calculator.enableDarkMode = () => {
  document.body.classList.add('dark-theme');
  localStorage.setItem('calculator-theme', 'dark');
  calculator.updateThemeIcon(true);
  console.log('Dark mode enabled');
};

calculator.enableLightMode = () => {
  document.body.classList.remove('dark-theme');
  localStorage.setItem('calculator-theme', 'light');
  calculator.updateThemeIcon(false);
  console.log('Light mode enabled');
};

// Keyboard shortcut for theme toggle (Ctrl/Cmd + T)
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 't') {
    event.preventDefault();
    document.getElementById('theme-toggle')?.click();
  }
  
  // Keyboard shortcut for sound toggle (Ctrl/Cmd + S)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    calculator.toggleSound();
  }
});
