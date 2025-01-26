// // src/components/Map.js

// import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
// import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
// import "mapbox-gl/dist/mapbox-gl.css";

// const Map = () => {
//   const mapContainerRef = useRef(null); // Reference to map container
//   const [map, setMap] = useState(null); // State to store the map instance

//   const addCircleToMap = (coordinates, radiusMeters) => {
//     // First, remove any existing circle

//     if (!map) {
//       console.error("Map is not initialized");
//       return;
//     }
    
//     if (map.getSource('circle')) {
//       map.removeLayer('circle-layer');
//       map.removeSource('circle');
//     }

//     // Add a new circle to the map
//     const circleGeoJSON = {
//       type: 'FeatureCollection',
//       features: [
//         {
//           type: 'Feature',
//           geometry: {
//             type: 'Point',
//             coordinates: coordinates,
//           }
//         }
//       ]
//     };

//     map.addSource('circle', {
//       type: 'geojson',
//       data: circleGeoJSON,
//     });

//     map.addLayer({
//       id: 'circle-layer',
//       type: 'circle',
//       source: 'circle',
//       paint: {
//         'circle-radius': {
//           stops: [
//             [0, 0],
//             [20, radiusMeters / map.getZoom()], // Adjust radius based on zoom
//           ]
//         },
//         'circle-color': '#007cbf',
//         'circle-opacity': 0.5,
//       }
//     });
//   };


//   useEffect(() => {
//     // Set Mapbox access token
//     mapboxgl.accessToken = 'pk.eyJ1IjoiaW1wLXVuaXF1ZTc1MDciLCJhIjoiY20yZnFnZWRqMGMxNTJscTJrdnMyNnB3cCJ9.nDPkD12D6xzkvSy2KZ0Fgg'; // Replace with your actual Mapbox access token

//     // Initialize Mapbox map
//     const mapInstance = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/satellite-streets-v11", // Satellite view
//       center: [-74.5, 40], // Initial map center [lng, lat]
//       zoom: 12, // Initial zoom level
//     });

//     // Store the map instance in state
//     setMap(mapInstance);

//     // Initialize MapboxGeocoder (search bar with autocomplete)
//     const geocoder = new MapboxGeocoder({
//       accessToken: mapboxgl.accessToken,
//       mapboxgl: mapboxgl,
//       marker: true, // Add marker for selected location
//       placeholder: "Search for places...", // Placeholder text
//       zoom: 15, // Zoom level when a location is selected
//     });

//     // Add geocoder (search bar) to the map
//     mapInstance.addControl(geocoder);

//     // Listen for geocoder result event (place selection)
//     geocoder.on("result", (e) => {
//       if(map){
//         console.log("Selected place: ", e.result);
//       const coordinates = e.result.geometry.coordinates;


//       const radiusInMeters = 1000;
//       addCircleToMap(coordinates, radiusInMeters);

//       // Fly to the selected location with satellite view
//       mapInstance.flyTo({
//         center: coordinates,
//         essential: true,
//         duration:500, // This ensures the user sees the transition
//       });
//       }
//     });

//     return () => {
//       // Cleanup on component unmount
//       if (map) {
//         map.remove();
//       }
//     };
//   }, []);

//   return (
//     <div>
//       <div
//         ref={mapContainerRef}
//         style={{ width: "100%", height: "500px" }}
//       />
//     </div>
//   );
// };

// export default Map;




// src/components/Map.js

// src/components/Map.js
// src/components/Map.js
import {sendImageDetails} from '../../src/Services/image_service';
import React, { useEffect, useRef, useState } from  "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";

const Map = () => {
  const mapContainerRef = useRef(null); // Reference to map container
  const [map, setMap] = useState(null); // State to store the map instance
  const [staticImageUrl, setStaticImageUrl] = useState(""); // State to store the static image URL

  const generateCircleCoordinates = (center, radius) => {
    const coordinates = [];
    const numPoints = 64; // Number of points to create the circle
    const earthRadius = 6371000; // Earth's radius in meters

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI; // Calculate angle for each point
      const dx = radius * Math.cos(angle); // Calculate x-offset
      const dy = radius * Math.sin(angle); // Calculate y-offset

      // Calculate new latitude and longitude
      const lat = center[1] + (dy / earthRadius) * (180 / Math.PI);
      const lon = center[0] + (dx / (earthRadius * Math.cos((Math.PI * center[1]) / 180))) * (180 / Math.PI);

      coordinates.push([lon, lat]); // Push the new point into the coordinates array
    }

    coordinates.push(coordinates[0]); // Close the circle by repeating the first point
    return coordinates;
  };

  
  const addCircleToMap = (coordinates, radiusMeters) => {
    if(!map){
      return;
    }
    // First, remove any existing circle
    if (map.getSource('circle')) {
      map.removeLayer('circle-layer');
      map.removeSource('circle');
    }

    // Generate circle coordinates
    const circleCoordinates = generateCircleCoordinates(coordinates, radiusMeters);

    // Create GeoJSON for the circle
    const circleGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [circleCoordinates],
          },
        },
      ],
    };

    // Add a new circle to the map
    map.addSource('circle', {
      type: 'geojson',
      data: circleGeoJSON,
    });

    map.addLayer({
      id: 'circle-layer',
      type: 'fill',
      source: 'circle',
      paint: {
        'fill-color': '#007cbf',
        'fill-opacity': 0.5,
      },
    });
  };

  const getStaticMapImage = async (coordinates) => {
    const [lng, lat] = coordinates;
    const radiusInMeters = 1000;
    await sendImageDetails(lng,lat);

    // const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},15,0/600x400?access_token=${mapboxgl.accessToken}`;
    const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/static/${lng},${lat},15,0/600x400?access_token=${mapboxgl.accessToken}&attribution=false&logo=false&marker=${lng},${lat};`;
    setStaticImageUrl(staticMapUrl);
  };

  useEffect(() => {
    // Set Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW1wLXVuaXF1ZTc1MDciLCJhIjoiY20yZnFnZWRqMGMxNTJscTJrdnMyNnB3cCJ9.nDPkD12D6xzkvSy2KZ0Fgg'; // Replace with your actual Mapbox access token

    // Initialize Mapbox map
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v11", // Satellite view
      center: [-74.5, 40], // Initial map center [lng, lat]
      zoom: 12, // Initial zoom level
    });

    // Store the map instance in state
    setMap(mapInstance);

    // Initialize MapboxGeocoder (search bar with autocomplete)
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: true, // Add marker for selected location
      placeholder: "Search for places...", // Placeholder text
      zoom: 15, // Zoom level when a location is selected
    });

    // Add geocoder (search bar) to the map
    mapInstance.addControl(geocoder);

    // Listen for geocoder result event (place selection)
    geocoder.on("result", (e) => {
      console.log("Selected place: ", e.result);
      const coordinates = e.result.geometry.coordinates;

      const radiusInMeters = 1000;
      addCircleToMap(coordinates, radiusInMeters);

      // Fly to the selected location with satellite view
      mapInstance.flyTo({
        center: coordinates,
        essential: true, // This ensures the user sees the transition
      });

      // Get static image of the area
      getStaticMapImage(coordinates);
    });

    return () => {
      // Cleanup on component unmount
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />
      {staticImageUrl && (
        <div>
          <h3>Static Map Image (1 km Radius)</h3>
          <img src={staticImageUrl} alt="Static Map" />
        </div>
      )}
    </div>
  );
};

export default Map;
