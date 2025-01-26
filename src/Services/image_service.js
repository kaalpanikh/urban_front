

export async function sendImageDetails(lng,lat){
    let data = {lng,lat};
    console.log(`lng and lat coming form method ${lng} ${lat}`)
    // Send POST request to FastAPI backend
    const response = await fetch("http://localhost:8000/image-details", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    const result= await response.json();

    console.log(result);

}