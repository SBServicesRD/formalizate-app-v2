const fs = require('fs');

async function testGemini() {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyB_5SP9ycopEWHWryKCLWhYNdbvtpXhess');
    const data = await response.json();
    fs.writeFileSync('gemini_result.json', JSON.stringify(data, null, 2));
    console.log('Resultado guardado en gemini_result.json');
  } catch (error) {
    fs.writeFileSync('gemini_result.json', JSON.stringify({ error: error.message }, null, 2));
    console.error('Error:', error.message);
  }
}

testGemini();
