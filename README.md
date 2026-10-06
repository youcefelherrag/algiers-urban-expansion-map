# algiers-urban-expansion-map
A geospatial workflow using Google Earth Engine and QGIS to analyze and visualize urban growth in Algiers (2016-2026).
# Algiers Urban Expansion Analysis (2016–2026)

A professional geospatial workflow designed to extract, process, and visualize urban sprawl in Algiers, combining Google Earth Engine, QGIS, and dynamic video editing.

## 🚀 End-to-End Technical Workflow

### 1. Satellite Imagery Processing & NDBI Calculation (Google Earth Engine)
* Retrieved and filtered multi-temporal satellite imagery for the Algiers study area.
* Computed the **Normalized Difference Built-up Index (NDBI)** utilizing Near-Infrared (NIR) and Short-Wave Infrared (SWIR) bands to accurately isolate and extract built-up surfaces.
* Applied statistical thresholding and spatial filtering to separate actual urban footprints for each temporal period (2016 vs. 2026).
* Quantified spatial growth, computing precise area measurements (hectares/square kilometers) for newly developed zones.

### 2. Cartographic Design & Layer Generation (QGIS)
* Imported the processed GEE datasets into QGIS under the appropriate geographic coordinate system to ensure exact spatial alignment.
* Designed two distinct, high-resolution map layouts: a baseline layer representing the urban extent of 2016, and an updated layer highlighting new urban expansion zones in a prominent yellow color.
* Integrated essential professional cartographic elements, including a scale bar, North arrow, and a focused legend.
* Exported high-resolution map outputs while maintaining a fixed geographic frame and identical dimensions to ensure zero spatial shifting.

### 3. Animation & Post-Production (CapCut)
* Imported the synchronized map assets, positioning the 2026 expansion map precisely as an overlay directly above the 2016 baseline map.
* Set a targeted 5-second timeline duration for professional engagement.
* Applied a horizontal mask combined with precise **Keyframe Animation** to create a smooth, radar-like wipe effect from right to left, contrasting historical data with recent urban growth.
* Exported the final high-definition MP4 output.

## 📂 Repository Structure
* `algiers_urban_expansion.js`: The core Google Earth Engine script used for data extraction and NDBI processing.
