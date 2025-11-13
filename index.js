const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ConvertHandler Class (Complete functionality)
class ConvertHandler {
  getNum(input) {
    // Find the index where unit starts
    let unitIndex = input.search(/[a-zA-Z]/);
    
    if (unitIndex === -1) {
      // No unit found, check if it's a valid number
      if (input === '') return 1;
      unitIndex = input.length;
    }
    
    const numberStr = input.slice(0, unitIndex);
    
    if (numberStr === '') return 1;
    
    // Check for fractions
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
    
    const number = parseFloat(numberStr);
    return isNaN(number) ? 'invalid number' : number;
  }

  getUnit(input) {
    const units = ['gal', 'l', 'mi', 'km', 'lbs', 'kg'];
    
    // Find the unit part
    let unitIndex = input.search(/[a-zA-Z]/);
    if (unitIndex === -1) return 'invalid unit';
    
    const unitStr = input.slice(unitIndex).toLowerCase();
    
    // Special case for liters
    if (unitStr === 'l' || unitStr === 'liter' || unitStr === 'liters') return 'L';
    
    // Check if unit is valid
    const validUnit = units.find(unit => unit === unitStr);
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
    
    return initNum * conversionRates[initUnit];
  }

  getString(initNum, initUnit, returnNum, returnUnit) {
    const initUnitString = this.spellOutUnit(initUnit);
    const returnUnitString = this.spellOutUnit(returnUnit);
    
    return `${initNum} ${initUnitString} converts to ${returnNum} ${returnUnitString}`;
  }
}

// Create instance
const convertHandler = new ConvertHandler();

// API Routes
app.get('/api/convert', (req, res) => {
  try {
    const input = req.query.input;
    
    if (!input) {
      return res.json({ error: 'No input provided' });
    }

    // Get number and unit
    const initNum = convertHandler.getNum(input);
    const initUnit = convertHandler.getUnit(input);
    
    // Validate
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

    res.json({
      initNum,
      initUnit,
      returnNum: parseFloat(returnNum.toFixed(5)),
      returnUnit,
      string
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            }
            h1 { 
                color: #333; 
                text-align: center;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #666;
                text-align: center;
                margin-bottom: 30px;
            }
            .example { 
                background: #f9f9f9; 
                padding: 20px; 
                margin: 15px 0; 
                border-radius: 10px;
                border-left: 4px solid #667eea;
            }
            code {
                background: #f1f1f1;
                padding: 4px 8px;
                border-radius: 4px;
                font-family: monospace;
            }
            .test-area {
                background: #e9f7ef;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }
            input, button {
                padding: 12px;
                margin: 5px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
            }
            button {
                background: #667eea;
                color: white;
                border: none;
                cursor: pointer;
            }
            button:hover {
                background: #5a6fd8;
            }
            #result {
                margin-top: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 5px;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📐 Metric-Imperial Converter</h1>
            <p class="subtitle">Convert between gallons/liters, miles/kilometers, and pounds/kilograms</p>
            
            <div class="test-area">
                <h3>🔧 Test the API</h3>
                <input type="text" id="inputValue" placeholder="Enter value like: 4gal, 1/2km, 5.4lbs" style="width: 300px;">
                <button onclick="testConvert()">Convert</button>
                <div id="result"></div>
            </div>
            
            <div class="example">
                <strong>📖 API Usage:</strong><br>
                Use endpoint: <code>GET /api/convert?input=4gal</code>
            </div>
            
            <div class="example">
                <strong>🎯 Examples:</strong><br>
                <code>/api/convert?input=4gal</code><br>
                <code>/api/convert?input=1/2km</code><br>
                <code>/api/convert?input=5.4/3lbs</code><br>
                <code>/api/convert?input=kg</code>
            </div>
            
            <div class="example">
                <strong>✅ Supported units:</strong><br>
                • gal (gallons) ↔ L (liters)<br>
                • mi (miles) ↔ km (kilometers)<br>
                • lbs (pounds) ↔ kg (kilograms)
            </div>
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
                            '<strong>✅ Conversion Result:</strong><br>' +
                            '<strong>Input:</strong> ' + data.initNum + ' ' + data.initUnit + '<br>' +
                            '<strong>Output:</strong> ' + data.returnNum + ' ' + data.returnUnit + '<br>' +
                            '<strong>Full:</strong> ' + data.string;
                    }
                    resultDiv.style.display = 'block';
                } catch (error) {
                    resultDiv.innerHTML = '<strong style="color: red;">Network Error:</strong> ' + error.message;
                    resultDiv.style.display = 'block';
                }
            }
            
            // Enter key support
            document.getElementById('inputValue').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    testConvert();
                }
            });
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