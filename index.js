const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ConvertHandler Class (FIXED FOR ALL TESTS)
class ConvertHandler {
  getNum(input) {
    if (!input) return 1;
    
    // Find the index where unit starts (first alphabet)
    let unitIndex = input.search(/[a-zA-Z]/);
    
    if (unitIndex === -1) {
      // No letters found, check if it's a valid number
      if (input === '') return 1;
      unitIndex = input.length;
    }
    
    const numberStr = input.slice(0, unitIndex).trim();
    
    // If no number provided, default to 1
    if (numberStr === '') return 1;
    
    // Check for double fractions (3/2/3)
    const slashCount = (numberStr.match(/\//g) || []).length;
    if (slashCount > 1) return 'invalid number';
    
    // Handle fractions
    if (numberStr.includes('/')) {
      const parts = numberStr.split('/');
      if (parts.length !== 2) return 'invalid number';
      
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return 'invalid number';
      }
      
      return numerator / denominator;
    }
    
    // Handle decimal numbers
    const number = parseFloat(numberStr);
    return isNaN(number) ? 'invalid number' : number;
  }

  getUnit(input) {
    if (!input) return 'invalid unit';
    
    const validUnits = ['gal', 'l', 'mi', 'km', 'lbs', 'kg'];
    
    // Find the unit part (everything after numbers)
    let unitIndex = input.search(/[a-zA-Z]/);
    if (unitIndex === -1) return 'invalid unit';
    
    let unitStr = input.slice(unitIndex).toLowerCase();
    
    // Handle liter unit (should be uppercase L in response)
    if (unitStr === 'l' || unitStr === 'liter' || unitStr === 'liters') {
      return 'L';
    }
    
    // Check if unit is valid
    const validUnit = validUnits.find(unit => unit === unitStr);
    return validUnit ? validUnit : 'invalid unit';
  }

  getReturnUnit(initUnit) {
    const unitPairs = {
      'gal': 'L',
      'L': 'gal',
      'mi': 'km', 
      'km': 'mi',
      'lbs': 'kg',
      'kg': 'lbs'
    };
    
    return unitPairs[initUnit] || 'invalid unit';
  }

  spellOutUnit(unit) {
    const spellings = {
      'gal': 'gallons',
      'L': 'liters', 
      'mi': 'miles',
      'km': 'kilometers',
      'lbs': 'pounds',
      'kg': 'kilograms'
    };
    
    return spellings[unit] || unit;
  }

  convert(initNum, initUnit) {
    const conversionRates = {
      'gal': 3.78541,    // gallons to liters
      'L': 1/3.78541,    // liters to gallons  
      'mi': 1.60934,     // miles to kilometers
      'km': 1/1.60934,   // kilometers to miles
      'lbs': 0.453592,   // pounds to kilograms
      'kg': 1/0.453592   // kilograms to pounds
    };
    
    const result = initNum * conversionRates[initUnit];
    return parseFloat(result.toFixed(5));
  }

  getString(initNum, initUnit, returnNum, returnUnit) {
    const initUnitString = this.spellOutUnit(initUnit);
    const returnUnitString = this.spellOutUnit(returnUnit);
    
    return `${initNum} ${initUnitString} converts to ${returnNum} ${returnUnitString}`;
  }
}

// Create instance
const convertHandler = new ConvertHandler();

// API Routes - FIXED ENDPOINT
app.get('/api/convert', (req, res) => {
  try {
    const input = req.query.input;
    
    if (!input) {
      return res.json({ error: 'No input provided' });
    }

    // Get number and unit
    const initNum = convertHandler.getNum(input);
    const initUnit = convertHandler.getUnit(input);
    
    // Validation with exact error messages
    if (initNum === 'invalid number' && initUnit === 'invalid unit') {
      return res.json({ error: 'invalid number and unit' });
    }
    if (initNum === 'invalid number') {
      return res.json({ error: 'invalid number' });
    }
    if (initUnit === 'invalid unit') {
      return res.json({ error: 'invalid unit' });
    }

    // Convert
    const returnNum = convertHandler.convert(initNum, initUnit);
    const returnUnit = convertHandler.getReturnUnit(initUnit);
    const string = convertHandler.getString(initNum, initUnit, returnNum, returnUnit);

    // Return with correct format
    res.json({
      initNum: initNum,
      initUnit: initUnit,
      returnNum: returnNum,
      returnUnit: returnUnit,
      string: string
    });

  } catch (error) {
    res.json({ error: 'Server error' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Metric-Imperial Converter</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; text-align: center; }
            .test-area { background: #e9f7ef; padding: 20px; margin: 20px 0; border-radius: 10px; }
            input, button { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 5px; }
            button { background: #007bff; color: white; border: none; cursor: pointer; }
            #result { margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Metric-Imperial Converter</h1>
            
            <div class="test-area">
                <h3>Test the API</h3>
                <input type="text" id="inputValue" placeholder="Enter: 4gal, 1/2km, kg" style="width: 250px;">
                <button onclick="testConvert()">Convert</button>
                <div id="result"></div>
            </div>
            
            <p><strong>Endpoint:</strong> GET /api/convert?input=4gal</p>
            <p><strong>Supported units:</strong> gal/L, mi/km, lbs/kg</p>
        </div>

        <script>
            async function testConvert() {
                const input = document.getElementById('inputValue').value;
                const resultDiv = document.getElementById('result');
                
                if (!input) {
                    alert('Please enter a value');
                    return;
                }
                
                try {
                    const response = await fetch('/api/convert?input=' + encodeURIComponent(input));
                    const data = await response.json();
                    
                    if (data.error) {
                        resultDiv.innerHTML = '<strong style="color: red;">Error:</strong> ' + data.error;
                    } else {
                        resultDiv.innerHTML = 
                            '<strong>Result:</strong><br>' +
                            'Input: ' + data.initNum + ' ' + data.initUnit + '<br>' +
                            'Output: ' + data.returnNum + ' ' + data.returnUnit + '<br>' +
                            'String: ' + data.string;
                    }
                } catch (error) {
                    resultDiv.innerHTML = '<strong style="color: red;">Error:</strong> ' + error.message;
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Server configuration
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Metric-Imperial Converter running on port ${PORT}`);
});

module.exports = app;