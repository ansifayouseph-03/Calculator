class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.isDegreeMode = true; // Default to Degrees
        this.clear();
    }

    clear() {
        this.expression = [];
        this.currentOperand = '0';
        this.readyToReset = false;
        this.isError = false;
        this.updateDisplay();
    }

    delete() {
        if (this.isError) {
            this.clear();
            return;
        }
        if (this.readyToReset) {
            this.clear();
            return;
        }
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '' || this.currentOperand === '-') {
            this.currentOperand = '0';
        }
        this.updateDisplay();
    }

    appendNumber(number) {
        if (this.isError) this.clear();

        // Handle parentheses
        if (number === '(' || number === ')') {
            if (this.currentOperand !== '' && this.currentOperand !== '0' && number === '(') {
                // Implicit multiplication if placing a `(` right after a number
                this.expression.push(this.currentOperand);
                this.expression.push('*');
                this.currentOperand = '';
            } else if (this.currentOperand !== '' && this.currentOperand !== '0') {
                // Push current number before closing parentheses
                this.expression.push(this.currentOperand);
                this.currentOperand = '';
            }
            this.expression.push(number);
            this.readyToReset = false;
            this.triggerAnimation();
            this.updateDisplay();
            return;
        }

        // Handle Constants
        if (number === 'π' || number === 'e') {
            if (this.readyToReset) this.clear();
            if (this.currentOperand !== '0' && this.currentOperand !== '') {
                // implicit multiplication
                this.expression.push(this.currentOperand);
                this.expression.push('*');
            }
            this.currentOperand = number === 'π' ? Math.PI.toString() : Math.E.toString();
            this.readyToReset = true;
            this.triggerAnimation();
            this.updateDisplay();
            return;
        }

        if (number === '.' && this.currentOperand.includes('.')) return;

        if (this.readyToReset) {
            this.clear();
            this.currentOperand = number === '.' ? '0.' : number;
        } else {
            if (this.currentOperand === '0' && number !== '.') {
                this.currentOperand = number;
            } else {
                if (this.currentOperand.replace('.', '').length >= 15) return;
                this.currentOperand = this.currentOperand.toString() + number.toString();
            }
        }
        this.triggerAnimation();
        this.updateDisplay();
    }

    toggleDegRad() {
        this.isDegreeMode = !this.isDegreeMode;
        document.getElementById('btn-deg-rad').innerText = this.isDegreeMode ? 'DEG' : 'RAD';
        this.updateDisplay();
    }

    chooseOperation(operation) {
        if (this.isError) return;

        let opSymbol = '';
        switch (operation) {
            case 'add': opSymbol = '+'; break;
            case 'subtract': opSymbol = '-'; break;
            case 'multiply': opSymbol = '*'; break;
            case 'divide': opSymbol = '/'; break;
            case 'power': opSymbol = '^'; break;
        }

        if (this.currentOperand === '') {
            // Change the last operator if we just pressed one, and it's not a parenthesis
            if (this.expression.length > 0) {
                const lastEl = this.expression[this.expression.length - 1];
                if (['+', '-', '*', '/', '^'].includes(lastEl)) {
                    this.expression[this.expression.length - 1] = opSymbol;
                } else if (lastEl === ')') {
                    this.expression.push(opSymbol);
                }
            }
            this.updateDisplay();
            return;
        }

        this.expression.push(this.currentOperand);
        this.expression.push(opSymbol);
        this.currentOperand = '';
        this.readyToReset = false;
        this.updateDisplay();
    }

    applyScientific(operation) {
        if (this.isError) return;
        if (this.readyToReset && this.expression.length === 0) {
            // we have a calculated result on screen.
        } else if (this.currentOperand === '' || this.currentOperand === '0') {
            // Create a formal function wrapper e.g. "sin("
            let fnName = operation;
            if (operation === 'factorial') fnName = '!'; // factorial is postfix
            if (operation === 'sqrt') fnName = 'sqrt';

            if (fnName === '!') return; // can't do postfix on empty

            this.expression.push(`${fnName}(`);
            this.updateDisplay();
            return;
        }

        let current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;

        let result;
        const angleFactor = this.isDegreeMode ? (Math.PI / 180) : 1;

        try {
            switch (operation) {
                case 'percentage': result = current / 100; break;
                case 'sqrt':
                    if (current < 0) { this.isError = true; result = 'Error'; }
                    else result = Math.sqrt(current); break;
                case 'sin': result = Math.sin(current * angleFactor); break;
                case 'cos': result = Math.cos(current * angleFactor); break;
                case 'tan': result = Math.tan(current * angleFactor); break;
                case 'ln':
                    if (current <= 0) { this.isError = true; result = 'Error'; }
                    else result = Math.log(current); break;
                case 'log':
                    if (current <= 0) { this.isError = true; result = 'Error'; }
                    else result = Math.log10(current); break;
                case 'factorial':
                    if (current < 0 || !Number.isInteger(current)) { this.isError = true; result = 'Error'; }
                    else result = this.factorial(current); break;
                default: return;
            }

            if (!this.isError) {
                // Smooth out trigonometric floating point imprecision (e.g., sin(180) returning 1.22e-16)
                if (Math.abs(result) < 1e-10) result = 0;

                this.currentOperand = this.formatResult(result);
                this.triggerAnimation();
            } else {
                this.currentOperand = 'Error';
            }
            this.readyToReset = true;
            this.updateDisplay();
        } catch (e) {
            this.isError = true;
            this.currentOperand = 'Error';
            this.updateDisplay();
        }
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    formatResult(num) {
        if (!Number.isFinite(num)) {
            this.isError = true;
            return 'Error';
        }
        if (!Number.isInteger(num)) {
            let formatted = parseFloat(num.toPrecision(12)).toString();
            if (formatted.length > 10 && !formatted.includes('e')) {
                formatted = parseFloat(num.toFixed(10)).toString();
            }
            return formatted;
        }
        return num.toString();
    }

    compute() {
        if (this.isError) return;
        if (this.currentOperand === '' && this.expression.length === 0) return;

        let tokens = [...this.expression];
        if (this.currentOperand !== '') {
            tokens.push(this.currentOperand);
        } else {
            // Remove lingering operator if we just hit equals without a number
            const lastOp = tokens[tokens.length - 1];
            if (['+', '-', '*', '/', '^'].includes(lastOp)) {
                tokens.pop();
            }
        }

        if (tokens.length === 0) return;

        try {
            // Shunting-Yard implementation to handle parentheses
            let result = this.evaluateTokensWithParens(tokens);

            if (result === 'Error' || isNaN(result)) {
                this.isError = true;
                this.currentOperand = 'Error';
            } else {
                this.currentOperand = this.formatResult(result);
                this.readyToReset = true;
                this.triggerAnimation();
            }
            this.expression = []; // Clear expression
            this.updateDisplay();
        } catch (e) {
            this.isError = true;
            this.currentOperand = 'Error';
            this.expression = [];
            this.updateDisplay();
        }
    }

    // Core Engine using Shunting Yard conceptually simplified for the calculator tokens
    evaluateTokensWithParens(tokens) {
        // First balance parentheses
        let openCount = tokens.reduce((a, t) => a + (t === '(' || t.includes('(') ? 1 : 0), 0);
        let closeCount = tokens.reduce((a, t) => a + (t === ')' ? 1 : 0), 0);

        let safeTokens = [...tokens];
        while (openCount > closeCount) {
            safeTokens.push(')');
            closeCount++;
        }

        // Parse math functions and normalize string based tokens
        let normalized = [];
        for (let t of safeTokens) {
            if (typeof t === 'string' && t.endsWith('(')) {
                normalized.push(t.replace('(', '')); // Push function name
                normalized.push('('); // Push literal paren
            } else {
                normalized.push(t);
            }
        }

        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
        const isOperator = (c) => ['+', '-', '*', '/', '^'].includes(c);

        let postFix = [];
        let opStack = [];

        const angleFactor = this.isDegreeMode ? (Math.PI / 180) : 1;

        for (let t of normalized) {
            if (!isNaN(parseFloat(t)) && !isOperator(t) && t !== '(' && t !== ')') {
                postFix.push(parseFloat(t));
            } else if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(t)) {
                opStack.push(t);
            } else if (t === '(') {
                opStack.push(t);
            } else if (t === ')') {
                while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
                    postFix.push(opStack.pop());
                }
                opStack.pop(); // Pop '('

                // If there's a unary scientific function waiting before the paren, pop it
                if (opStack.length > 0 && ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(opStack[opStack.length - 1])) {
                    postFix.push(opStack.pop());
                }
            } else if (isOperator(t)) {
                while (opStack.length > 0 &&
                    precedence[opStack[opStack.length - 1]] >= precedence[t] &&
                    opStack[opStack.length - 1] !== '(') {
                    postFix.push(opStack.pop());
                }
                opStack.push(t);
            }
        }

        while (opStack.length > 0) {
            const op = opStack.pop();
            if (op === '(' || op === ')') return 'Error';
            postFix.push(op);
        }

        // Evaluate Postfix
        let evalStack = [];
        for (let x of postFix) {
            if (!isNaN(parseFloat(x))) {
                evalStack.push(x);
            } else if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(x)) {
                let a = evalStack.pop();
                if (a === undefined) return 'Error';
                let res;
                switch (x) {
                    case 'sqrt': res = Math.sqrt(a); break;
                    case 'sin': res = Math.sin(a * angleFactor); break;
                    case 'cos': res = Math.cos(a * angleFactor); break;
                    case 'tan': res = Math.tan(a * angleFactor); break;
                    case 'ln': res = Math.log(a); break;
                    case 'log': res = Math.log10(a); break;
                }
                if (Math.abs(res) < 1e-10) res = 0; // Floating point cleanup
                evalStack.push(res);
            } else if (isOperator(x)) {
                let b = evalStack.pop();
                let a = evalStack.pop();
                if (a === undefined || b === undefined) return 'Error';

                switch (x) {
                    case '+': evalStack.push(a + b); break;
                    case '-': evalStack.push(a - b); break;
                    case '*': evalStack.push(a * b); break;
                    case '/':
                        if (b === 0) return 'Error';
                        evalStack.push(a / b);
                        break;
                    case '^': evalStack.push(Math.pow(a, b)); break;
                }
            }
        }

        if (evalStack.length !== 1) return 'Error';
        return evalStack.pop();
    }

    getDisplayNumber(number) {
        if (number === 'Error') return 'Error';
        if (number === '') return '';
        if (number === '-') return '-';
        if (['(', ')'].includes(number.toString())) return number;
        if (typeof number === 'string' && number.endsWith('(')) return number;

        const stringNumber = number.toString();

        if (stringNumber.includes('e')) {
            const num = parseFloat(number);
            return num.toExponential(6);
        }

        if (isNaN(parseFloat(stringNumber))) return stringNumber;

        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];

        let integerDisplay = '';
        if (!isNaN(integerDigits)) {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }

        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);

        // Dynamic font resizing
        const currentLength = this.currentOperand.length;
        if (currentLength > 15) {
            this.currentOperandElement.style.fontSize = '1.3rem';
        } else if (currentLength > 11) {
            this.currentOperandElement.style.fontSize = '1.7rem';
        } else if (currentLength > 8) {
            this.currentOperandElement.style.fontSize = '2.2rem';
        } else {
            this.currentOperandElement.style.fontSize = '2.8rem';
        }

        let expressionStr = this.expression.map(t => {
            if (['+', '-', '*', '/', '^'].includes(t)) {
                switch (t) {
                    case '+': return '+';
                    case '-': return '−';
                    case '*': return '×';
                    case '/': return '÷';
                    case '^': return '^';
                }
            }
            return this.getDisplayNumber(t);
        }).join(' ').replace(/ \(/g, '('); // tighten parenthesis rendering

        this.previousOperandElement.innerText = expressionStr;

        document.querySelectorAll('.btn.op').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.currentOperand === '' && this.expression.length > 0) {
            let lastOp = this.expression[this.expression.length - 1];
            let rawAction = '';
            switch (lastOp) {
                case '+': rawAction = 'add'; break;
                case '-': rawAction = 'subtract'; break;
                case '*': rawAction = 'multiply'; break;
                case '/': rawAction = 'divide'; break;
                case '^': rawAction = 'power'; break;
            }
            const activeOpBtn = document.querySelector(`.btn.op[data-action="${rawAction}"]`);
            if (activeOpBtn) {
                activeOpBtn.classList.add('active');
            }
        }
    }

    triggerAnimation() {
        this.currentOperandElement.classList.remove('number-animate');
        void this.currentOperandElement.offsetWidth;
        this.currentOperandElement.classList.add('number-animate');
    }
}

const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// Degree/Radian toggle
document.getElementById('btn-deg-rad').addEventListener('click', () => {
    calculator.toggleDegRad();
});

// Event Listeners for Buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', () => {
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }

        if (button.classList.contains('num') || button.dataset.number) {
            calculator.appendNumber(button.dataset.number);
        } else if (button.dataset.action) {
            const action = button.dataset.action;

            switch (action) {
                case 'clear': calculator.clear(); break;
                case 'delete': calculator.delete(); break;
                case 'add': case 'subtract': case 'multiply': case 'divide': case 'power':
                    calculator.chooseOperation(action); break;
                case 'calculate': calculator.compute(); break;
                case 'percentage': case 'sqrt': case 'sin': case 'cos': case 'tan':
                case 'ln': case 'log': case 'factorial':
                    calculator.applyScientific(action); break;
            }
        }
    });
});

// Keyboard Support
document.addEventListener('keydown', e => {
    const key = e.key;

    if (/[0-9.]/.test(key) || key === '(' || key === ')') {
        e.preventDefault();
        calculator.appendNumber(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault();
        let action;
        if (key === '+') action = 'add';
        if (key === '-') action = 'subtract';
        if (key === '*') action = 'multiply';
        if (key === '/') action = 'divide';
        calculator.chooseOperation(action);
    } else if (key === '^') {
        e.preventDefault();
        calculator.chooseOperation('power');
    } else if (key === '%') {
        e.preventDefault();
        calculator.applyScientific('percentage');
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculator.compute();
    } else if (key === 'Backspace') {
        e.preventDefault();
        calculator.delete();
    } else if (key === 'Escape') {
        e.preventDefault();
        calculator.clear();
    }

    const buttonMap = {
        'Escape': '#btn-ac',
        'Backspace': '#btn-del',
        '%': '#btn-perc',
        '/': '#btn-div',
        '*': '#btn-mul',
        '-': '#btn-sub',
        '+': '#btn-add',
        '^': '#btn-pow',
        '=': '#btn-eq',
        'Enter': '#btn-eq',
        '(': '#btn-paren-open',
        ')': '#btn-paren-close'
    };

    let selector = '';
    if (/[0-9.]/.test(key)) {
        selector = `[data-number="${key}"]`;
    } else if (buttonMap[key]) {
        selector = buttonMap[key];
    }

    if (selector) {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.classList.add('keyboard-active');
            setTimeout(() => {
                btn.classList.remove('keyboard-active');
            }, 100);
        }
    }
});
