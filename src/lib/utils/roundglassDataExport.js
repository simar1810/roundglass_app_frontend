"use client";

import { format } from "date-fns";
import * as XLSX from "xlsx";
import { exportToCSV } from "./roundglassAnalytics";

/**
 * Process data in chunks to avoid blocking the UI
 * @param {Array} array - Array to process
 * @param {Function} processor - Function to process each item
 * @param {number} chunkSize - Number of items to process per chunk
 * @param {Function} onProgress - Optional progress callback (current, total)
 * @returns {Promise<Array>} Processed array
 */
async function processInChunks(array, processor, chunkSize = 100, onProgress = null) {
  const results = [];
  const total = array.length;
  
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Yield to browser to prevent blocking
    if (onProgress) {
      onProgress(i + chunk.length, total);
    }
    
    // Allow browser to process other tasks
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  return results;
}

/**
 * Estimate processing time based on data size
 * @param {number} itemCount - Number of items to process
 * @returns {number} Estimated time in milliseconds
 */
function estimateProcessingTime(itemCount) {
  // Rough estimate: ~1ms per item for formatting
  return Math.max(100, itemCount * 1);
}

/**
 * Format a date value for export (consistent format)
 * @param {string|Date} dateValue - Date to format
 * @returns {string} Formatted date string or empty string
 */
function formatDateForExport(dateValue) {
  if (!dateValue) return "";
  
  try {
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return String(dateValue);
    return format(date, "yyyy-MM-dd HH:mm:ss");
  } catch (error) {
    return String(dateValue);
  }
}

/**
 * Flatten nested object for CSV/Excel export
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Prefix for nested keys
 * @returns {Object} Flattened object
 */
function flattenObject(obj, prefix = "") {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      const value = obj[key];
      
      if (value === null || value === undefined) {
        flattened[newKey] = "";
      } else if (value instanceof Date) {
        flattened[newKey] = formatDateForExport(value);
      } else if (typeof value === "object" && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        // For arrays, join with semicolon or create indexed entries
        if (value.length === 0) {
          flattened[newKey] = "";
        } else if (typeof value[0] === "object") {
          // Array of objects - join with semicolon
          flattened[newKey] = value.map(item => 
            typeof item === "object" ? JSON.stringify(item) : String(item)
          ).join("; ");
        } else {
          flattened[newKey] = value.join("; ");
        }
      } else {
        flattened[newKey] = String(value);
      }
    }
  }
  
  return flattened;
}

/**
 * Format client data for export
 * Converts API response to flat array suitable for CSV/Excel
 * @param {Object} apiResponse - API response from exportClientData
 * @param {Function} onProgress - Optional progress callback (current, total, stage)
 * @returns {Promise<Array<Object>>} Array of formatted objects
 */
export async function formatClientDataForExport(apiResponse, onProgress = null) {
  if (!apiResponse || apiResponse.status_code !== 200 || !apiResponse.data) {
    return [];
  }

  const { client, preferences } = apiResponse.data;
  const formattedData = [];
  
  // Estimate total items for progress tracking
  const totalPreferences = preferences?.length || 0;
  let processedItems = 0;
  const totalItems = totalPreferences * 5; // Rough estimate (pref + training + supplements + injuries + diet)

  // Format client basic info
  const clientInfo = {
    "Client ID": client?._id || "",
    "Client Name": client?.name || "",
    "Email": client?.email || "",
    "Client ID (Numeric)": client?.clientId || "",
    "Profile Photo": client?.profilePhoto || "",
  };
  formattedData.push(clientInfo);

  // Format preferences with chunked processing for large datasets
  if (preferences && Array.isArray(preferences) && preferences.length > 0) {
    const isLargeDataset = preferences.length > 50;
    const chunkSize = isLargeDataset ? 10 : preferences.length;
    
    for (let i = 0; i < preferences.length; i += chunkSize) {
      const chunk = preferences.slice(i, i + chunkSize);
      
      for (const pref of chunk) {
        const index = i + chunk.indexOf(pref);
        const prefData = {
          "Preference Index": index + 1,
          "Preference ID": pref?._id || "",
          "Allergies": pref?.allergies || "",
          "Medical History": pref?.medicalHistory || "",
          "Family History": pref?.familyHistory || "",
        };

        // Add training modules
        if (pref?.trainingModule && Array.isArray(pref.trainingModule) && pref.trainingModule.length > 0) {
          for (const module of pref.trainingModule) {
            const modIndex = pref.trainingModule.indexOf(module);
            const trainingData = {
              ...prefData,
              "Training Module Index": modIndex + 1,
              "Training Frequency": module?.trainingFrequency || "",
              "Training Duration": module?.duration || "",
              "Training Intensity": module?.intensity || "",
              "Conditioning Days": module?.conditioningDays || "",
            };
            formattedData.push(trainingData);
            processedItems++;
          }
        } else {
          formattedData.push(prefData);
          processedItems++;
        }

        // Add supplements
        if (pref?.supplements && Array.isArray(pref.supplements) && pref.supplements.length > 0) {
          for (const supplement of pref.supplements) {
            const suppIndex = pref.supplements.indexOf(supplement);
            const suppData = {
              ...prefData,
              "Supplement Index": suppIndex + 1,
              "Supplement Brand": supplement?.brand || "",
              "Supplement Dosage": supplement?.dosage || "",
              "Supplement Frequency": supplement?.frequency || "",
              "Supplement Source": supplement?.source || "",
              "Supplement Purpose": supplement?.purpose || "",
              "Supplement Date": formatDateForExport(supplement?.dateTime),
            };
            formattedData.push(suppData);
            processedItems++;
          }
        }

        // Add injuries
        if (pref?.injuries && Array.isArray(pref.injuries) && pref.injuries.length > 0) {
          for (const injury of pref.injuries) {
            const injIndex = pref.injuries.indexOf(injury);
            const injuryData = {
              ...prefData,
              "Injury Index": injIndex + 1,
              "Injury Type": injury?.injuryType || "",
              "Body Part": injury?.bodyPart || "",
              "Incident Date": formatDateForExport(injury?.incidentDate),
              "Rehab Progress": injury?.rehabProgress || "",
              "Physiotherapist": injury?.physiotherapistAssignment || "",
              "Injury File Upload": injury?.fileUpload || "",
            };
            formattedData.push(injuryData);
            processedItems++;
          }
        }

        // Add diet recall
        if (pref?.dietRecall && Array.isArray(pref.dietRecall) && pref.dietRecall.length > 0) {
          for (const diet of pref.dietRecall) {
            const dietIndex = pref.dietRecall.indexOf(diet);
            const dietData = {
              ...prefData,
              "Diet Recall Index": dietIndex + 1,
              ...flattenObject(diet, "Diet"),
            };
            formattedData.push(dietData);
            processedItems++;
          }
        }
      }
      
      // Progress update and yield to browser
      if (onProgress) {
        onProgress(processedItems, totalItems, "Formatting preferences");
      }
      
      // Yield to browser for large datasets
      if (isLargeDataset) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  return formattedData;
}

/**
 * Format team data for export
 * Converts API response to multiple arrays for different sheets
 * @param {Object} apiResponse - API response from exportTeamData
 * @param {Function} onProgress - Optional progress callback (current, total, stage)
 * @returns {Promise<Object>} Object with different data arrays for different sheets
 */
export async function formatTeamDataForExport(apiResponse, onProgress = null) {
  if (!apiResponse || apiResponse.status_code !== 200 || !apiResponse.data) {
    return {
      categories: [],
      clients: [],
      preferences: [],
      healthStats: [],
      trainingStats: [],
      supplementStats: [],
      injuryStats: [],
      comparison: [],
      interCategoryComparison: [],
    };
  }

  const { categories, metadata, interCategoryComparison } = apiResponse.data;
  const formatted = {
    categories: [],
    clients: [],
    preferences: [],
    healthStats: [],
    trainingStats: [],
    supplementStats: [],
    injuryStats: [],
    comparison: [],
    interCategoryComparison: [],
  };

  // Estimate total items for progress
  const totalCategories = categories?.length || 0;
  let processedCategories = 0;

  // Process each category with chunked processing for large datasets
  if (categories && Array.isArray(categories)) {
    const isLargeDataset = totalCategories > 5;
    const chunkSize = isLargeDataset ? 2 : totalCategories;
    
    for (let catIdx = 0; catIdx < categories.length; catIdx += chunkSize) {
      const categoryChunk = categories.slice(catIdx, catIdx + chunkSize);
      
      for (const categoryData of categoryChunk) {
      const { category, coach, clients, preferences, healthStats, trainingStats, supplementStats, injuryStats, comparison } = categoryData;

      // Category info
      formatted.categories.push({
        "Category ID": category?._id || "",
        "Category Name": category?.name || "",
        "Coach ID": coach?._id || "",
        "Coach Name": coach?.name || "",
        "Coach Email": coach?.email || "",
        "Coach ID (Numeric)": coach?.coachId || "",
        "Total Clients": coach?.totalClients || 0,
        "Active Clients": coach?.activeClients || 0,
      });

        // Clients list - process in chunks for large datasets
        if (clients && Array.isArray(clients)) {
          const isLargeClientList = clients.length > 100;
          const clientChunkSize = isLargeClientList ? 50 : clients.length;
          
          for (let i = 0; i < clients.length; i += clientChunkSize) {
            const clientChunk = clients.slice(i, i + clientChunkSize);
            for (const client of clientChunk) {
              formatted.clients.push({
                "Category ID": category?._id || "",
                "Category Name": category?.name || "",
                "Client ID": client?._id || "",
                "Client Name": client?.name || "",
                "Client Email": client?.email || "",
                "Client ID (Numeric)": client?.clientId || "",
                "Profile Photo": client?.profilePhoto || "",
                "Coach ID": client?.coach || "",
              });
            }
            
            // Yield for large lists
            if (isLargeClientList) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }

        // Preferences - process in chunks
        if (preferences && Array.isArray(preferences)) {
          const isLargePrefList = preferences.length > 100;
          const prefChunkSize = isLargePrefList ? 50 : preferences.length;
          
          for (let i = 0; i < preferences.length; i += prefChunkSize) {
            const prefChunk = preferences.slice(i, i + prefChunkSize);
            for (const pref of prefChunk) {
              formatted.preferences.push({
                "Category ID": category?._id || "",
                "Category Name": category?.name || "",
                "Preference ID": pref?._id || "",
                "Client ID": pref?.clientId || "",
                "Allergies": pref?.allergies || "",
                "Medical History": pref?.medicalHistory || "",
                "Family History": pref?.familyHistory || "",
                "Training Modules Count": pref?.trainingModule?.length || 0,
                "Supplements Count": pref?.supplements?.length || 0,
                "Injuries Count": pref?.injuries?.length || 0,
                "Diet Recall Count": pref?.dietRecall?.length || 0,
              });
            }
            
            // Yield for large lists
            if (isLargePrefList) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }

      // Health Statistics
      if (healthStats && typeof healthStats === "object") {
        Object.entries(healthStats).forEach(([metric, stats]) => {
          formatted.healthStats.push({
            "Category ID": category?._id || "",
            "Category Name": category?.name || "",
            "Metric": metric,
            "Mean": stats?.mean || "",
            "Median": stats?.median || "",
            "Min": stats?.min || "",
            "Max": stats?.max || "",
            "Std Dev": stats?.stdDev || "",
            "Count": stats?.count || 0,
            "P25": stats?.percentiles?.p25 || "",
            "P50": stats?.percentiles?.p50 || "",
            "P75": stats?.percentiles?.p75 || "",
            "P90": stats?.percentiles?.p90 || "",
            "P95": stats?.percentiles?.p95 || "",
          });
        });
      }

      // Training Statistics
      if (trainingStats && typeof trainingStats === "object") {
        formatted.trainingStats.push({
          "Category ID": category?._id || "",
          "Category Name": category?.name || "",
          "Total Clients": trainingStats?.totalClients || 0,
          "Frequency Distribution": JSON.stringify(trainingStats?.frequencyDistribution || {}),
          "Duration Mean": trainingStats?.durationStatistics?.mean || "",
          "Duration Median": trainingStats?.durationStatistics?.median || "",
          "Duration Min": trainingStats?.durationStatistics?.min || "",
          "Duration Max": trainingStats?.durationStatistics?.max || "",
          "Intensity Distribution": JSON.stringify(trainingStats?.intensityDistribution || {}),
          "Conditioning Days Distribution": JSON.stringify(trainingStats?.conditioningDaysDistribution || {}),
        });
      }

      // Supplement Statistics
      if (supplementStats && typeof supplementStats === "object") {
        formatted.supplementStats.push({
          "Category ID": category?._id || "",
          "Category Name": category?.name || "",
          "Total Clients": supplementStats?.totalClients || 0,
          "Brand Distribution": JSON.stringify(supplementStats?.brandDistribution || {}),
          "Purpose Distribution": JSON.stringify(supplementStats?.purposeDistribution || {}),
          "Dosage Frequency": JSON.stringify(supplementStats?.dosageFrequency || {}),
          "Supplements Per Client Mean": supplementStats?.supplementsPerClientStats?.mean || "",
          "Supplements Per Client Median": supplementStats?.supplementsPerClientStats?.median || "",
        });
      }

      // Injury Statistics
      if (injuryStats && typeof injuryStats === "object") {
        formatted.injuryStats.push({
          "Category ID": category?._id || "",
          "Category Name": category?.name || "",
          "Total Clients": injuryStats?.totalClients || 0,
          "Body Part Distribution": JSON.stringify(injuryStats?.bodyPartDistribution || {}),
          "Injury Type Distribution": JSON.stringify(injuryStats?.injuryTypeDistribution || {}),
          "Injuries Per Client Mean": injuryStats?.injuriesPerClientStats?.mean || "",
          "Rehab Progress Mean": injuryStats?.rehabProgressStats?.mean || "",
        });
      }

        // Comparison Data - process in chunks
        if (comparison && comparison.clients && Array.isArray(comparison.clients)) {
          const isLargeComparison = comparison.clients.length > 100;
          const compChunkSize = isLargeComparison ? 50 : comparison.clients.length;
          
          for (let i = 0; i < comparison.clients.length; i += compChunkSize) {
            const compChunk = comparison.clients.slice(i, i + compChunkSize);
            for (const clientComp of compChunk) {
              const metricsData = {};
              if (clientComp.metrics && typeof clientComp.metrics === "object") {
                Object.entries(clientComp.metrics).forEach(([metric, metricData]) => {
                  metricsData[`${metric}_value`] = metricData?.value || "";
                  metricsData[`${metric}_percentile`] = metricData?.percentile || "";
                });
              }

              formatted.comparison.push({
                "Category ID": category?._id || "",
                "Category Name": category?.name || "",
                "Client ID": clientComp?.clientId || "",
                "Client Name": clientComp?.name || "",
                ...metricsData,
              });
            }
            
            // Yield for large lists
            if (isLargeComparison) {
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          }
        }
        
        processedCategories++;
      }
      
      // Progress update and yield to browser
      if (onProgress) {
        onProgress(processedCategories, totalCategories, "Processing categories");
      }
      
      // Yield to browser for large datasets
      if (isLargeDataset) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  // Inter-Category Comparison
  if (interCategoryComparison && typeof interCategoryComparison === "object") {
    Object.entries(interCategoryComparison).forEach(([categoryId, compData]) => {
      if (compData.statistics && typeof compData.statistics === "object") {
        Object.entries(compData.statistics).forEach(([metric, stats]) => {
          formatted.interCategoryComparison.push({
            "Category ID": categoryId,
            "Category Name": compData?.categoryName || "",
            "Metric": metric,
            "Mean": stats?.mean || "",
            "Median": stats?.median || "",
            "Min": stats?.min || "",
            "Max": stats?.max || "",
            "Std Dev": stats?.stdDev || "",
            "Total Clients": compData?.totalClients || 0,
          });
        });
      }
    });
  }

  return formatted;
}

/**
 * Export client data as CSV
 * @param {Object} apiResponse - API response from exportClientData
 * @param {string} filename - Filename prefix (without extension)
 * @param {Function} onProgress - Optional progress callback
 */
export async function exportClientDataToCSV(apiResponse, filename = "client-data-export", onProgress = null) {
  const formattedData = await formatClientDataForExport(apiResponse, onProgress);
  
  if (formattedData.length === 0) {
    console.warn("No client data to export");
    return;
  }

  if (onProgress) {
    onProgress(formattedData.length, formattedData.length, "Generating CSV");
  }

  exportToCSV(formattedData, filename);
}

/**
 * Export client data as Excel with multiple sheets
 * @param {Object} apiResponse - API response from exportClientData
 * @param {string} filename - Filename (without extension)
 * @param {Function} onProgress - Optional progress callback
 */
export async function exportClientDataToExcel(apiResponse, filename = "client-data-export", onProgress = null) {
  const formattedData = await formatClientDataForExport(apiResponse, onProgress);
  
  if (formattedData.length === 0) {
    throw new Error("No client data to export");
  }

  if (onProgress) {
    onProgress(formattedData.length, formattedData.length, "Creating Excel workbook");
  }

  // For Excel, we can create multiple sheets
  // Sheet 1: All data
  // Sheet 2: Client info only
  // Sheet 3: Preferences summary
  
  const workbook = XLSX.utils.book_new();
  
  // Main sheet with all data - use streaming for large datasets
  const isLargeDataset = formattedData.length > 1000;
  
  if (isLargeDataset && onProgress) {
    onProgress(0, formattedData.length, "Processing large dataset...");
  }
  
  // For large datasets, process in chunks
  let mainSheet;
  if (isLargeDataset) {
    // Process in chunks to avoid memory issues
    const chunkSize = 500;
    const chunks = [];
    for (let i = 0; i < formattedData.length; i += chunkSize) {
      chunks.push(formattedData.slice(i, i + chunkSize));
      if (onProgress) {
        onProgress(Math.min(i + chunkSize, formattedData.length), formattedData.length, "Processing data chunks");
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    mainSheet = XLSX.utils.json_to_sheet(formattedData);
  } else {
    mainSheet = XLSX.utils.json_to_sheet(formattedData);
  }
  
  XLSX.utils.book_append_sheet(workbook, mainSheet, "All Data");
  
  // Client info sheet (first row only)
  if (formattedData.length > 0) {
    const clientInfo = [formattedData[0]];
    const clientSheet = XLSX.utils.json_to_sheet(clientInfo);
    XLSX.utils.book_append_sheet(workbook, clientSheet, "Client Info");
  }

  // Set column widths
  const sheets = [mainSheet];
  sheets.forEach((sheet) => {
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    sheet["!cols"] = Array.from({ length: range.e.c + 1 }, () => ({ wch: 20 }));
  });

  if (onProgress) {
    onProgress(formattedData.length, formattedData.length, "Finalizing Excel file");
  }

  const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
  XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
}

/**
 * Export team data as CSV
 * Creates separate CSV files for each data type
 * @param {Object} apiResponse - API response from exportTeamData
 * @param {string} filename - Filename prefix (without extension)
 * @param {Function} onProgress - Optional progress callback
 */
export async function exportTeamDataToCSV(apiResponse, filename = "team-data-export", onProgress = null) {
  const formatted = await formatTeamDataForExport(apiResponse, onProgress);
  
  const totalFiles = 9;
  let exportedFiles = 0;
  
  // Export each data type as separate CSV
  if (formatted.categories.length > 0) {
    exportToCSV(formatted.categories, `${filename}-categories`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting categories");
  }
  if (formatted.clients.length > 0) {
    exportToCSV(formatted.clients, `${filename}-clients`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting clients");
    await new Promise((resolve) => setTimeout(resolve, 0)); // Yield
  }
  if (formatted.preferences.length > 0) {
    exportToCSV(formatted.preferences, `${filename}-preferences`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting preferences");
    await new Promise((resolve) => setTimeout(resolve, 0)); // Yield
  }
  if (formatted.healthStats.length > 0) {
    exportToCSV(formatted.healthStats, `${filename}-health-stats`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting health stats");
  }
  if (formatted.trainingStats.length > 0) {
    exportToCSV(formatted.trainingStats, `${filename}-training-stats`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting training stats");
  }
  if (formatted.supplementStats.length > 0) {
    exportToCSV(formatted.supplementStats, `${filename}-supplement-stats`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting supplement stats");
  }
  if (formatted.injuryStats.length > 0) {
    exportToCSV(formatted.injuryStats, `${filename}-injury-stats`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting injury stats");
  }
  if (formatted.comparison.length > 0) {
    exportToCSV(formatted.comparison, `${filename}-comparison`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting comparison");
    await new Promise((resolve) => setTimeout(resolve, 0)); // Yield
  }
  if (formatted.interCategoryComparison.length > 0) {
    exportToCSV(formatted.interCategoryComparison, `${filename}-inter-category-comparison`);
    exportedFiles++;
    if (onProgress) onProgress(exportedFiles, totalFiles, "Exporting inter-category comparison");
  }
}

/**
 * Export team data as Excel with multiple sheets
 * @param {Object} apiResponse - API response from exportTeamData
 * @param {string} filename - Filename (without extension)
 * @param {Function} onProgress - Optional progress callback
 */
export async function exportTeamDataToExcel(apiResponse, filename = "team-data-export", onProgress = null) {
  const formatted = await formatTeamDataForExport(apiResponse, onProgress);
  
  const workbook = XLSX.utils.book_new();
  const totalSheets = 9;
  let processedSheets = 0;
  
  // Add sheets for each data type with progress updates
  if (formatted.categories.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(formatted.categories);
    XLSX.utils.book_append_sheet(workbook, sheet, "Categories");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Categories sheet");
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  if (formatted.clients.length > 0) {
    const isLarge = formatted.clients.length > 1000;
    if (isLarge && onProgress) {
      onProgress(processedSheets, totalSheets, "Processing large clients dataset...");
    }
    const sheet = XLSX.utils.json_to_sheet(formatted.clients);
    XLSX.utils.book_append_sheet(workbook, sheet, "Clients");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Clients sheet");
    if (isLarge) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  if (formatted.preferences.length > 0) {
    const isLarge = formatted.preferences.length > 1000;
    if (isLarge && onProgress) {
      onProgress(processedSheets, totalSheets, "Processing large preferences dataset...");
    }
    const sheet = XLSX.utils.json_to_sheet(formatted.preferences);
    XLSX.utils.book_append_sheet(workbook, sheet, "Preferences");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Preferences sheet");
    if (isLarge) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  if (formatted.healthStats.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(formatted.healthStats);
    XLSX.utils.book_append_sheet(workbook, sheet, "Health Stats");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Health Stats sheet");
  }
  
  if (formatted.trainingStats.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(formatted.trainingStats);
    XLSX.utils.book_append_sheet(workbook, sheet, "Training Stats");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Training Stats sheet");
  }
  
  if (formatted.supplementStats.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(formatted.supplementStats);
    XLSX.utils.book_append_sheet(workbook, sheet, "Supplement Stats");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Supplement Stats sheet");
  }
  
  if (formatted.injuryStats.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(formatted.injuryStats);
    XLSX.utils.book_append_sheet(workbook, sheet, "Injury Stats");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Injury Stats sheet");
  }
  
  if (formatted.comparison.length > 0) {
    const isLarge = formatted.comparison.length > 1000;
    if (isLarge && onProgress) {
      onProgress(processedSheets, totalSheets, "Processing large comparison dataset...");
    }
    const sheet = XLSX.utils.json_to_sheet(formatted.comparison);
    XLSX.utils.book_append_sheet(workbook, sheet, "Comparison");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Comparison sheet");
    if (isLarge) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  
  if (formatted.interCategoryComparison.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(formatted.interCategoryComparison);
    XLSX.utils.book_append_sheet(workbook, sheet, "Inter-Category");
    processedSheets++;
    if (onProgress) onProgress(processedSheets, totalSheets, "Creating Inter-Category sheet");
  }

  // Set column widths for all sheets
  if (onProgress) {
    onProgress(processedSheets, totalSheets, "Setting column widths");
  }
  
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    sheet["!cols"] = Array.from({ length: range.e.c + 1 }, () => ({ wch: 20 }));
  });

  if (onProgress) {
    onProgress(processedSheets, totalSheets, "Finalizing Excel file");
  }

  const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
  XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
}

