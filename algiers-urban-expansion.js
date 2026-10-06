// =============================================================================
// URBAN EXPANSION ANALYSIS — ALGIERS (2016 vs 2026)
// Dataset: Sentinel-2 MSI Level-2A (Harmonized) Surface Reflectance
// Index:   NDBI = (B11 - B8) / (B11 + B8)
// Author:  Remote Sensing / GEE
// =============================================================================

// -----------------------------------------------------------------------------
// 1. STUDY AREA (ROI)
// -----------------------------------------------------------------------------
// Draw a polygon in the Code Editor and rename the import to 'geometry'.
// Ensure the imported geometry is a Polygon (not a Point/LineString).
var roi = geometry;

// Center the map on the ROI
Map.centerObject(roi, 10);
Map.addLayer(roi, {color: 'yellow'}, 'ROI (Algiers)', false);

// -----------------------------------------------------------------------------
// 2. REUSABLE FUNCTION: Filter Sentinel-2 SR for a given date range
// -----------------------------------------------------------------------------
/**
 * Build a median composite of Sentinel-2 SR Harmonized imagery.
 * @param {string} startDate - 'YYYY-MM-DD'
 * @param {string} endDate   - 'YYYY-MM-DD'
 * @param {ee.Geometry} region - ROI
 * @return {ee.Image} Cloud-masked median composite (scaled reflectance)
 */
function getS2Composite(startDate, endDate, region) {

  // Cloud masking function for Sentinel-2 SR Harmonized
  // QA60 bit 10 = opaque clouds, bit 11 = cirrus
  var maskClouds = function(image) {
    var qa = image.select('QA60');
    var cloudBitMask  = 1 << 10;
    var cirrusBitMask = 1 << 11;
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
                 .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    return image.updateMask(mask);
  };

  var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
    .map(maskClouds);

  // Guard: if collection is empty, return null (prevents downstream errors)
  var size = collection.size();
  print('Image count for ' + startDate + ' to ' + endDate + ':', size);
  if (size.getInfo() === 0) {
    print('⚠️ No images available for ' + startDate + ' → ' + endDate +
          '. Composite will be empty.');
    return null;
  }

  // Median composite (scaled to reflectance; keep original integer scaling
  // because NDBI is a ratio and scale cancels out).
  return collection.median().clip(region);
}

// -----------------------------------------------------------------------------
// 3. REUSABLE FUNCTION: Compute NDBI and apply urban threshold
// -----------------------------------------------------------------------------
/**
 * Compute NDBI and produce a self-masked binary urban layer.
 * @param {ee.Image} composite - S2 median composite
 * @param {number} threshold   - NDBI threshold for urban (default 0.02)
 * @return {ee.Image} Binary urban mask (1 = urban, masked elsewhere)
 */
function computeUrbanMask(composite, threshold) {
  if (composite === null) { return null; }

  threshold = (threshold === undefined) ? 0.02 : threshold;

  // NDBI = (B11 - B8) / (B11 + B8)
  var ndbi = composite.normalizedDifference(['B11', 'B8']).rename('NDBI');

  // Binary urban mask
  var urban = ndbi.gt(threshold).rename('urban');

  // Self-mask: keep only urban pixels (value = 1)
  return urban.selfMask();
}

// -----------------------------------------------------------------------------
// 4. APPLY TO 2016 AND 2026
// -----------------------------------------------------------------------------
var year2016 = {start: '2016-06-01', end: '2016-09-30'};
var year2026 = {start: '2026-06-01', end: '2026-09-30'};

var composite2016 = getS2Composite(year2016.start, year2016.end, roi);
var composite2026 = getS2Composite(year2026.start, year2026.end, roi);

var urban2016 = computeUrbanMask(composite2016, 0.02);
var urban2026 = computeUrbanMask(composite2026, 0.02);

// -----------------------------------------------------------------------------
// 5. VISUALIZATION
// -----------------------------------------------------------------------------
Map.addLayer(urban2016, {palette: ['0000FF']}, 'Urban 2016 (Blue)', true);
Map.addLayer(urban2026, {palette: ['FF0000']}, 'Urban 2026 (Red)', true);

// -----------------------------------------------------------------------------
// 6. AREA CALCULATION (hectares)
// -----------------------------------------------------------------------------
/**
 * Compute total urban area in hectares for a binary mask.
 * Uses pixel area (m²) × count → hectares (1 ha = 10 000 m²).
 */
function urbanAreaHa(urbanMask, region) {
  if (urbanMask === null) { return null; }

  var areaImage = ee.Image.pixelArea().divide(10000); // m² → ha
  var stats = areaImage.updateMask(urbanMask).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: region,
    scale: 10,
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 4
  });

  return stats.get('area');
}

var area2016 = urbanAreaHa(urban2016, roi);
var area2026 = urbanAreaHa(urban2026, roi);

// Safe printing (handle null cases)
if (area2016 !== null) {
  print('🟦 Urban built-up area in 2016 (ha):', area2016);
} else {
  print('🟦 Urban built-up area in 2016 (ha): N/A');
}

if (area2026 !== null) {
  print('🟥 Urban built-up area in 2026 (ha):', area2026);
} else {
  print('🟥 Urban built-up area in 2026 (ha): N/A');
}

// Compute change if both available
if (area2016 !== null && area2026 !== null) {
  var change = ee.Number(area2026).subtract(ee.Number(area2016));
  var pctChange = change.divide(ee.Number(area2016)).multiply(100);
  print('📈 Urban expansion 2016 → 2026 (ha):', change);
  print('📊 Percentage change (%):', pctChange);
}

// -----------------------------------------------------------------------------
// 7. EXPORT RASTERS TO GOOGLE DRIVE
// -----------------------------------------------------------------------------
if (urban2016 !== null) {
  Export.image.toDrive({
    image: urban2016.toByte(),        // byte for compact binary raster
    description: 'Algiers_Urban_2016_NDBI',
    folder: 'GEE_Algiers_Urban',
    fileNamePrefix: 'Algiers_Urban_2016_NDBI',
    region: roi,
    scale: 10,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });
}

if (urban2026 !== null) {
  Export.image.toDrive({
    image: urban2026.toByte(),
    description: 'Algiers_Urban_2026_NDBI',
    folder: 'GEE_Algiers_Urban',
    fileNamePrefix: 'Algiers_Urban_2026_NDBI',
    region: roi,
    scale: 10,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });
}

// -----------------------------------------------------------------------------
// 8. (OPTIONAL) URBAN CHANGE MAP
// -----------------------------------------------------------------------------
// Uncomment the block below to visualize gain/loss pixels.
//
// if (urban2016 !== null && urban2026 !== null) {
//   var gain = urban2026.unmask(0).gt(0)
//              .and(urban2016.unmask(0).eq(0));   // new urban
//   var loss = urban2016.unmask(0).gt(0)
//              .and(urban2026.unmask(0).eq(0));   // lost urban
//   Map.addLayer(gain.selfMask(), {palette: ['00FF00']}, 'Urban Gain');
//   Map.addLayer(loss.selfMask(), {palette: ['FFA500']}, 'Urban Loss');
// }
