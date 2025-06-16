// For App Router: /app/api/generate/route.ts
import { NextResponse } from 'next/server';
// Get the API base URL from environment variables, with a fallback
const API_BASE_URL = process.env.API_BASE_URL || 'https://6709azb62m.execute-api.us-east-1.amazonaws.com/prod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

//create GET route to check if the API is working
//create GET route to check if the API is working
export async function GET(request: Request) {
  try {
    // Extract the executionArn from the URL search params
    const { searchParams } = new URL(request.url);
    const executionArn = searchParams.get('executionArn');
    
    if (!executionArn) {
      return NextResponse.json({ message: 'Missing executionArn parameter' }, { status: 400 });
    }
    
    // Construct the URL properly - use encodeURIComponent to handle special characters
    const apiUrl = `${API_BASE_URL}/status?executionArn=${encodeURIComponent(executionArn)}`;

    
    console.log('Calling API URL:', apiUrl); // Log the URL for debugging
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('API responded with status:', response.status);
      return NextResponse.json({ 
        message: `API request failed with status ${response.status}` 
      }, { status: response.status });
    }

  // Use the safer parsing method
  const data = await safeParseJson(response);
  console.log('Parsed API response:', data); // Log the parsed data for debugging
  return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error checking API:', error);
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}


// Helper function to safely parse JSON with error handling
async function safeParseJson(response: Response) {
  try {
    // Get the text response
    const text = await response.text();
    console.log('Raw API response:', text);
    
    try {
      // Try to parse as JSON directly
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // Try to fix common JSON issues
      let fixedText = text;
      
      // Fix missing commas between fields (look for "}\n" or "}" followed by a quote)
      fixedText = fixedText.replace(/"\s*}\s*"/g, '"},{"');
      fixedText = fixedText.replace(/"\s*"([^:])/g, '","$1');
      
      // Fix missing commas after values before next property
      fixedText = fixedText.replace(/"([^"]*?)"\s*"([^"]*?)":/g, '"$1","$2":');
      
      // Try to parse the fixed text
      try {
        console.log('Attempting to parse fixed JSON:', fixedText);
        return JSON.parse(fixedText);
      } catch (fixedParseError) {
        console.error('Failed to parse fixed JSON:', fixedParseError);
        
        // If all else fails, return a structured response with the raw text
        return {
          status: "Running", // Default status
          message: "Could not parse API response",
          rawResponse: text
        };
      }
    }
  } catch (error) {
    console.error('Error reading response:', error);
    return {
      status: "Failed",
      message: "Error reading API response",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

