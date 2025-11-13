const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

class ConvertHandler {
  getNum(input) {
    if (!input) return 1;
    
    // Find first alphabet character
    const match = input.match(/[a-zA-Z]/);
    if (!match) {
      // No unit found, check if it's just a number
      if (input.trim() === '') return 1;
      const num = this.evaluateNumber(input);
      return num === 'invalid' ? 'invalid number' : num;
    }
    
    const unitIndex = match.index;
    const numberStr = input.substring(0, unitIndex).trim();
    
    if (numberStr === '') return 1;
    
    return this.evaluateNumber(numberStr);
  }
  
  evaluateNumber(str) {
    // Check for multiple fractions
    if ((str.match(/\//g) || []).length > 1) {
      return 'invalid number';
    }
    
    // Handle fractions
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length !== 2) return 'invalid number';
      
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      
      if (isNaN(num) || isNaN(den) || den === 0) {
        return 'invalid number';
      }
      
      return num / den;
    }
    
    // Handle decimal numbers
    const num = parseFloat(str);
    return isNaN(num) ? 'invalid number' : num;
  }

  getUnit(input) {
    if (!input) return 'invalid unit';
    
    // Find first alphabet character
    const match = input.match(/[a-zA-Z]/);
    if (!match) return 'invalid unit';
    
    const unitStr = input.substring(match.index).toLowerCase().trim();
    
    const validUnits = {
      'gal': 'gal',
      'l': 'L', 
      'lbs': 'lbs',
      'kg': 'kg',
      'mi': 'mi',
      'km': 'km'
    };
    
    return validUnits[unitStr] || 'invalid unit';
  }

  getReturnUnit(initUnit) {
    const conversions = {
      'gal': 'L',
      'L': 'gal',
      'lbs': 'kg',
      'kg': 'lbs', 
      'mi': 'km',
      'km': 'mi'
    };
    
    return conversions[initUnit];
  }

  spellOutUnit(unit) {
    const spellings = {
      'gal': 'gallons',
      'L': 'liters',
      'lbs': 'pounds', 
      'kg': 'kilograms',
      'mi': 'miles',
      'km': 'kilometers'
    };
    
    return spellings[unit];
  }

  convert(initNum, initUnit) {
    const rates = {
      'gal': 3.78541,
      'L': 1/3.78541,
      'lbs': 0.453592,
      'kg': 1/0.453592,
      'mi': 1.60934,
      'km': 1/1.60934
    };
    
    return initNum * rates[initUnit];
  }

  getString(initNum, initUnit, returnNum, returnUnit) {
    const initStr = this.spellOutUnit(initUnit);
    const returnStr = this.spellOutUnit(returnUnit);
    
    return `${initNum} ${initStr} converts to ${parseFloat(returnNum.toFixed(5))} ${returnStr}`;
  }
}

const convertHandler = new ConvertHandler();

// API endpoint - EXACTLY as required
app.get('/api/convert', (req, res) => {
  const input = req.query.input;
  
  if (!input) {
    return res.send('invalid input');
  }
  
  const initNum = convertHandler.getNum(input);
  const initUnit = convertHandler.getUnit(input);
  
  // Check for errors
  if (initNum === 'invalid number' && initUnit === 'invalid unit') {
    return res.send('invalid number and unit');
  }
  if (initNum === 'invalid number') {
    return res.send('invalid number');
  }
  if (initUnit === 'invalid unit') {
    return res.send('invalid unit');
  }
  
  const returnNum = convertHandler.convert(initNum, initUnit);
  const returnUnit = convertHandler.getReturnUnit(initUnit);
  const string = convertHandler.getString(initNum, initUnit, returnNum, returnUnit);
  
  res.json({
    initNum: initNum,
    initUnit: initUnit,
    returnNum: parseFloat(returnNum.toFixed(5)),
    returnUnit: returnUnit,
    string: string
  });
});

// Home page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Metric-Imperial Converter</h1>
        <p>Use: /api/convert?input=4gal</p>
        <p>Test these:</p>
        <ul>
          <li>4gal</li>
          <li>1/2km</li> 
          <li>5.4lbs</li>
          <li>kg</li>
          <li>3/2/3kg (invalid)</li>
          <li>32g (invalid)</li>
        </ul>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

module.exports = app;