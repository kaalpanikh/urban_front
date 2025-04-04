// src/components/Map.js

import {sendImageDetails} from '../../src/Services/image_service';
import React, { useEffect, useRef, useState } from  "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapAnalysis.css";
import DevelopmentPlan from './DevelopmentPlan';

const Map = () => {
  const mapContainerRef = useRef(null); // Reference to map container
  const [map, setMap] = useState(null); // State to store the map instance
  const [staticImageUrl, setStaticImageUrl] = useState(""); // State to store the static image URL
  const [analysisResults, setAnalysisResults] = useState(null); // State to store the analysis results
  const [loading, setLoading] = useState(false); // Loading state

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
    
    setLoading(true);
    try {
      // Call backend API and get analysis results
      const analysisData = await sendImageDetails(lng, lat);
      setAnalysisResults(analysisData);
      
      // Generate static map URL
      const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/static/${lng},${lat},15,0/600x400?access_token=${mapboxgl.accessToken}&attribution=false&logo=false&marker=${lng},${lat};`;
      setStaticImageUrl(staticMapUrl);
    } catch (error) {
      console.error("Error analyzing location:", error);
    } finally {
      setLoading(false);
    }
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

  // Helper function to render land use data as a bar chart
  const renderLandUseChart = (landUseData) => {
    if (!landUseData || typeof landUseData === 'string' || landUseData.raw_analysis) {
      return <p>{landUseData?.raw_analysis || "Land use data not available in expected format"}</p>;
    }

    return (
      <div className="land-use-chart">
        {Object.entries(landUseData).map(([category, percentage]) => (
          <div key={category} className="land-use-item">
            <div className="land-use-label">{category}</div>
            <div className="land-use-bar-container">
              <div 
                className="land-use-bar" 
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: getLandUseColor(category)
                }}
              />
              <span className="land-use-percentage">{percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Get colors for land use categories
  const getLandUseColor = (category) => {
    const colors = {
      "Residential": "#FF9999",
      "Commercial": "#FF9933",
      "Industrial": "#CC9966",
      "Agricultural": "#99CC66",
      "Forest/Natural": "#339933",
      "Water bodies": "#3399FF",
      "Transportation infrastructure": "#666666",
      "Other": "#CCCCCC"
    };
    
    return colors[category] || "#CCCCCC";
  };

  // Helper function to render change analysis data
  const renderChangeAnalysis = (changeData) => {
    if (!changeData || changeData.status) {
      return <p>{changeData?.status || "No change data available"}</p>;
    }

    return (
      <div className="change-analysis">
        <h4>Changes Since Last Analysis</h4>
        <p>Previous analysis: {new Date(changeData.previous_analysis_time).toLocaleString()}</p>
        
        {changeData.detected_changes.land_use && (
          <div>
            <h5>Land Use Changes</h5>
            <table className="change-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Previous</th>
                  <th>Current</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(changeData.detected_changes.land_use).map(([category, data]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{data.previous}%</td>
                    <td>{data.current}%</td>
                    <td className={data.change > 0 ? "positive-change" : data.change < 0 ? "negative-change" : ""}>
                      {data.change > 0 ? "+" : ""}{data.change}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {changeData.detected_changes.vegetation_coverage && (
          <div>
            <h5>Vegetation Coverage Changes</h5>
            <p>Previous: {changeData.detected_changes.vegetation_coverage.previous}%</p>
            <p>Current: {changeData.detected_changes.vegetation_coverage.current}%</p>
            <p className={
              changeData.detected_changes.vegetation_coverage.change > 0 
                ? "positive-change" 
                : changeData.detected_changes.vegetation_coverage.change < 0 
                  ? "negative-change" 
                  : ""
            }>
              Change: {changeData.detected_changes.vegetation_coverage.change > 0 ? "+" : ""}
              {changeData.detected_changes.vegetation_coverage.change}%
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Map container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />
      
      {/* Loading indicator */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing satellite imagery...</p>
        </div>
      )}
      
      {/* Analysis results section */}
      {analysisResults && !loading && (
        <div className="analysis-container">
          <h2>Location Analysis</h2>
          
          <div className="analysis-grid">
            {/* Static image column */}
            <div className="analysis-column">
              <h3>Satellite Image</h3>
              {staticImageUrl && <img src={staticImageUrl} alt="Static Map" style={{ width: "100%" }} />}
            </div>
            
            {/* Analysis results column */}
            <div className="analysis-column">
              {analysisResults?.analysis_result?.analyses?.entity_detection && (
                <div className="analysis-section">
                  <h3>Detected Entities</h3>
                  <div className="entity-tags">
                    {analysisResults.analysis_result.analyses.entity_detection.entities.map((entity, index) => (
                      <span key={index} className="entity-tag">{entity.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {analysisResults?.analysis_result?.analyses?.land_use && (
                <div className="analysis-section">
                  <h3>Land Use Classification</h3>
                  {renderLandUseChart(analysisResults.analysis_result.analyses.land_use)}
                </div>
              )}
              
              {analysisResults?.analysis_result?.analyses?.vegetation && (
                <div className="analysis-section">
                  <h3>Vegetation Analysis</h3>
                  <div className="vegetation-data">
                    {Object.entries(analysisResults.analysis_result.analyses.vegetation).map(([key, value]) => (
                      <div key={key} className="vegetation-item">
                        <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Infrastructure column */}
            <div className="analysis-column">
              {analysisResults?.analysis_result?.analyses?.infrastructure && (
                <div className="analysis-section">
                  <h3>Infrastructure Detection</h3>
                  <div className="infrastructure-data">
                    {Object.entries(analysisResults.analysis_result.analyses.infrastructure).map(([key, value]) => (
                      <div key={key} className="infrastructure-item">
                        <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                        <p>{typeof value === 'object' ? JSON.stringify(value) : value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {analysisResults?.analysis_result?.change_analysis && (
                <div className="analysis-section">
                  <h3>Change Over Time</h3>
                  {renderChangeAnalysis(analysisResults.analysis_result.change_analysis)}
                </div>
              )}
              
              {analysisResults?.analysis_result?.development_plan && (
                <div className="analysis-section">
                  <h3>Development Plan</h3>
                  <DevelopmentPlan developmentPlan={analysisResults.analysis_result.development_plan} />
                </div>
              )}
            </div>
          </div>
          
          {/* Debug section */}
          <div className="debug-section" style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
            <h3>Debug Information</h3>
            <pre style={{ maxHeight: "200px", overflow: "auto" }}>
              {JSON.stringify(analysisResults, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
