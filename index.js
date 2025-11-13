const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

class ConvertHandler {
  getNum(input) {
    if (!input) return 1;
    
    const match = input.match(/[a-zA-Z]/);
    if (!match) {
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
    if ((str.match(/\//g) || []).length > 1) {
      return 'invalid number';
    }
    
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
    
    const num = parseFloat(str);
    return isNaN(num) ? 'invalid number' : num;
  }

  getUnit(input) {
    if (!input) return 'invalid unit';
    
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
    // EXACT conversion rates as per FreeCodeCamp tests
    const rates = {
      'gal': 3.78541,    // EXACT: 1 gal = 3.78541 L
      'L': 1/3.78541,    // EXACT: 1 L = 0.26417 gal
      'lbs': 0.453592,   // EXACT: 1 lbs = 0.453592 kg  
      'kg': 1/0.453592,  // EXACT: 1 kg = 2.20462 lbs
      'mi': 1.60934,     // EXACT: 1 mi = 1.60934 km
      'km': 1/1.60934    // EXACT: 1 km = 0.62137 mi
    };
    
    const result = initNum * rates[initUnit];
    return parseFloat(result.toFixed(5));
  }

  getString(initNum, initUnit, returnNum, returnUnit) {
    const initStr = this.spellOutUnit(initUnit);
    const returnStr = this.spellOutUnit(returnUnit);
    
    // EXACT string format required
    return `${initNum} ${initStr} converts to ${returnNum} ${returnStr}`;
  }
}

const convertHandler = new ConvertHandler();

app.get('/api/convert', (req, res) => {
  const input = req.query.input;
  
  if (!input) {
    return res.send('invalid input');
  }
  
  const initNum = convertHandler.getNum(input);
  const initUnit = convertHandler.getUnit(input);
  
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
    returnNum: returnNum, // Already rounded to 5 decimals in convert()
    returnUnit: returnUnit,
    string: string
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Metric-Imperial Converter</h1>
        <p>Use: /api/convert?input=4gal</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});

module.exports = app;