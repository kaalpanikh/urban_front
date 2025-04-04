export async function sendImageDetails(lng,lat){
    let data = {lng,lat};
    console.log(`Location coordinates: ${lng}, ${lat}`);
    
    // Send POST request to FastAPI backend
    try {
        console.log("Sending request to backend API...");
        const response = await fetch("http://localhost:8000/image-details", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse response text first
        const responseText = await response.text();
        console.log("Raw API response:", responseText);
        
        // Try to parse as JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return { 
                error: "Invalid response format", 
                rawResponse: responseText 
            };
        }
        
        // Unwrap arrays in the response if necessary (FastAPI sometimes wraps responses in arrays)
        if (Array.isArray(result) && result.length === 1) {
            result = result[0];
        }
        
        console.log("Processed analysis results:", result);
        return result;
    } catch (error) {
        console.error("Error fetching image details:", error);
        return { error: error.message };
    }
}