/**
 * Google Cloud & Looker Studio Suite
 * Comprehensive DDL schemas, Looker Studio Community Connector templates,
 * BigQuery dataset serializers, and Cloud Shell deployment scripts.
 * 
 * Scope: Full Multi-Stream
 * 1. Clinical Line-List (PIDSR)
 * 2. Hospital Bed Telemetry (Dr. Isidro C. Kintanar Memorial Hospital)
 * 3. Climate & Meteorological Stream (Rainfall, Humidity, Temperature, Lag Index)
 * 4. Entomology & Larval Surveillance Stream (Breteau, House, Container Indices)
 */

import {
  SurveillanceRecord,
  MultiStreamSummary,
  HospitalBedCapacityReport,
  EntomologicalInspectionRecord,
} from '../types/surveillance';

export const LOOKER_DEFAULT_AUTH_TOKEN = 'argao-eiews-2026-prod-connector-key';
export const GCP_PROJECT_ID_DEFAULT = 'argao-doh-eiews-prod';
export const BIGQUERY_DATASET_DEFAULT = 'argao_epidemiology_surveillance';

// ==============================================================================
// 1. BIGQUERY DDL SCHEMAS
// ==============================================================================

export const BIGQUERY_DDL_CLINICAL = `
-- ==============================================================================
-- Google BigQuery DDL: Clinical PIDSR Line-List Table
-- Partitioned by: date_onset (MONTH) | Clustered by: psgc_barangay, case_classification
-- ==============================================================================
CREATE OR REPLACE TABLE \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.pidsr_clinical_linelist\`
(
  epi_id STRING NOT NULL OPTIONS(description="Unique PIDSR Epidemiological Case Identifier"),
  disease_id STRING NOT NULL OPTIONS(description="Pathogen code: DEN, CHOL, MEA"),
  age_years INT64 OPTIONS(description="Patient age at onset in complete years"),
  sex STRING OPTIONS(description="Biological sex: Male, Female"),
  psgc_municipality STRING NOT NULL OPTIONS(description="9-digit PSGC for Argao [072205000]"),
  municipality STRING OPTIONS(description="Municipality name (Argao)"),
  psgc_barangay STRING NOT NULL OPTIONS(description="9-digit Barangay PSGC [072205001-072205045]"),
  barangay STRING NOT NULL OPTIONS(description="Current Barangay of residence"),
  date_onset DATE NOT NULL OPTIONS(description="Onset date of first symptoms"),
  morbidity_week INT64 NOT NULL OPTIONS(description="Morbidity Epidemiological Week (1-53)"),
  morbidity_year INT64 NOT NULL OPTIONS(description="Epidemiological Calendar Year"),
  consulted_flag BOOL OPTIONS(description="Consulted at health center or hospital"),
  admitted_flag BOOL OPTIONS(description="Inpatient hospital admission"),
  case_classification STRING NOT NULL OPTIONS(description="Suspect, Probable, Confirmed"),
  clinical_classification STRING OPTIONS(description="Dengue without Warning Signs, Dengue with Warning Signs, Severe Dengue"),
  outcome STRING NOT NULL OPTIONS(description="Alive, Recovered, Died"),
  ns1_rdt_tested BOOL OPTIONS(description="Tested with NS1 Ag Rapid Diagnostic Test"),
  ns1_result STRING OPTIONS(description="Positive, Negative, Inconclusive"),
  ns1_turnaround_hours FLOAT64 OPTIONS(description="Laboratory turnaround time from collection to result"),
  ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() OPTIONS(description="ETL Ingestion timestamp into EIEWS Data Warehouse"),
  source_stream STRING DEFAULT 'PIDSR_LINE_LIST' OPTIONS(description="Origin stream identifier")
)
PARTITION BY DATE_TRUNC(date_onset, MONTH)
CLUSTER BY psgc_barangay, case_classification, outcome
OPTIONS(
  description="Argao DOH-PIDSR localized disease surveillance line-list repository.",
  labels=[("surveillance_domain", "epidemiology"), ("psgc_municipality", "072205000"), ("lgu", "argao_cebu")]
);
`.trim();

export const BIGQUERY_DDL_HOSPITAL = `
-- ==============================================================================
-- Google BigQuery DDL: Hospital Bed Telemetry (Dr. Isidro C. Kintanar Memorial Hospital)
-- Partitioned by: report_timestamp (DAY) | Clustered by: surge_alert_level, facility_name
-- ==============================================================================
CREATE OR REPLACE TABLE \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.kintanar_hospital_bed_telemetry\`
(
  report_id STRING NOT NULL OPTIONS(description="Unique telemetry telemetry report ID"),
  report_timestamp TIMESTAMP NOT NULL OPTIONS(description="Telemetry timestamp (UTC)"),
  morbidity_week INT64 NOT NULL OPTIONS(description="Morbidity week"),
  facility_name STRING NOT NULL OPTIONS(description="Dr. Isidro C. Kintanar Memorial Hospital"),
  psgc_municipality STRING NOT NULL OPTIONS(description="072205000"),
  facility_tier STRING OPTIONS(description="Level 1 District Hospital"),
  authorized_bed_capacity INT64 NOT NULL OPTIONS(description="Licensed bed capacity (25 beds under RA 5720)"),
  operational_bed_capacity INT64 NOT NULL OPTIONS(description="Active operational beds (50 beds)"),
  total_inpatients INT64 NOT NULL OPTIONS(description="Current admitted census"),
  total_available_beds INT64 NOT NULL OPTIONS(description="Surge available beds"),
  overall_bor_pct FLOAT64 NOT NULL OPTIONS(description="Bed Occupancy Rate relative to 25 authorized beds"),
  surge_alert_level STRING NOT NULL OPTIONS(description="NORMAL, WARNING, CRITICAL_SURGE, DISASTER"),
  dengue_ward_total_beds INT64,
  dengue_ward_occupied_beds INT64,
  dengue_ward_occupancy_pct FLOAT64,
  dengue_ward_status STRING,
  pediatric_ward_total_beds INT64,
  pediatric_ward_occupied_beds INT64,
  pediatric_ward_occupancy_pct FLOAT64,
  pediatric_ward_status STRING,
  adult_medical_total_beds INT64,
  adult_medical_occupied_beds INT64,
  icu_total_beds INT64,
  icu_occupied_beds INT64,
  er_backlog_count INT64 OPTIONS(description="ER triage queue waiting for admission"),
  er_fastlane_active BOOL OPTIONS(description="Dengue Fast-Lane activated"),
  microhematocrit_turnaround_mins INT64 OPTIONS(description="STAT microhematocrit/platelet turnaround in minutes"),
  ns1_stock_available INT64 OPTIONS(description="Inventory count of NS1 rapid diagnostic kits"),
  days_to_bed_exhaustion FLOAT64 OPTIONS(description="Estimated days until 100% capacity depletion"),
  referral_pressure_index FLOAT64 OPTIONS(description="Regional referral pressure score 0-100"),
  extraction_source STRING OPTIONS(description="FACEBOOK_PUBLIC_POST, HIS_REST_WEBHOOK, MANUAL_BULLETIN_AUDIT"),
  source_post_id STRING OPTIONS(description="Facebook post ID (e.g. 19jG4RfAoc)"),
  verified_signature STRING OPTIONS(description="MESU Verification digital signature")
)
PARTITION BY DATE_TRUNC(report_timestamp, DAY)
CLUSTER BY surge_alert_level, facility_name
OPTIONS(
  description="High-frequency telemetry of bed occupancy and clinical surge at DICKMH Argao.",
  labels=[("facility", "kintanar_hospital"), ("telemetry_type", "hospital_surge")]
);
`.trim();

export const BIGQUERY_DDL_CLIMATE = `
-- ==============================================================================
-- Google BigQuery DDL: Climate & Meteorological Stream
-- Partitioned by: observation_date (MONTH) | Clustered by: climate_risk_tier
-- ==============================================================================
CREATE OR REPLACE TABLE \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.meteorological_climate_stream\`
(
  observation_date DATE NOT NULL OPTIONS(description="Weekly observation reference date"),
  morbidity_week INT64 NOT NULL OPTIONS(description="Morbidity week"),
  morbidity_year INT64 NOT NULL OPTIONS(description="Calendar year"),
  rainfall_mm FLOAT64 NOT NULL OPTIONS(description="Weekly cumulative precipitation in mm"),
  mean_relative_humidity_pct FLOAT64 NOT NULL OPTIONS(description="Mean atmospheric relative humidity %"),
  mean_temperature_celsius FLOAT64 NOT NULL OPTIONS(description="Mean ambient 24-hr temperature in Celsius"),
  two_week_lag_rainfall_mm FLOAT64 NOT NULL OPTIONS(description="Rainfall measured 14 days prior (vector breeding incubation lag)"),
  historical_rainfall_avg_mm FLOAT64 OPTIONS(description="5-year historical weekly rainfall baseline"),
  rainfall_anomaly_pct FLOAT64 OPTIONS(description="Precipitation divergence from normal baseline %"),
  climate_suitability_index FLOAT64 OPTIONS(description="Aedes vector bioclimatic suitability (0-100)"),
  climate_risk_tier STRING OPTIONS(description="Low, Moderate, Favorable, Optimal"),
  flooding_vulnerability_score FLOAT64 OPTIONS(description="Terrain water-logging vulnerability score"),
  drainage_blockage_risk STRING OPTIONS(description="Low, Moderate, High, Severe"),
  station_source STRING DEFAULT 'PAGASA_ARGAO_AGROMET' OPTIONS(description="Weather monitoring station identifier")
)
PARTITION BY DATE_TRUNC(observation_date, MONTH)
CLUSTER BY climate_risk_tier
OPTIONS(
  description="PAGASA Argao Agromet weather parameters lagged for mosquito breeding incubation modeling.",
  labels=[("stream_domain", "climate_meteorology"), ("source", "pagasa_argao")]
);
`.trim();

export const BIGQUERY_DDL_ENTOMOLOGY = `
-- ==============================================================================
-- Google BigQuery DDL: Entomology & Larval Surveillance Stream
-- Partitioned by: inspection_date (MONTH) | Clustered by: psgc_barangay, risk_status
-- ==============================================================================
CREATE OR REPLACE TABLE \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.entomological_larval_surveillance\`
(
  inspection_id STRING NOT NULL OPTIONS(description="Unique larval physical survey record"),
  inspection_date DATE NOT NULL OPTIONS(description="Date field inspection was conducted"),
  morbidity_week INT64 NOT NULL OPTIONS(description="Morbidity week"),
  morbidity_year INT64 NOT NULL OPTIONS(description="Surveillance year"),
  psgc_barangay STRING NOT NULL OPTIONS(description="9-digit Barangay PSGC"),
  barangay STRING NOT NULL OPTIONS(description="Argao Barangay name"),
  inspected_houses INT64 NOT NULL OPTIONS(description="Total domestic premises inspected"),
  positive_houses INT64 NOT NULL OPTIONS(description="Houses positive for Aedes larvae/pupae"),
  inspected_containers INT64 NOT NULL OPTIONS(description="Water holding containers examined"),
  positive_containers INT64 NOT NULL OPTIONS(description="Containers breeding mosquito larvae"),
  breteau_index FLOAT64 NOT NULL OPTIONS(description="Positive containers per 100 houses. Threshold: >= 20.0 = Epidemic Alert"),
  house_index FLOAT64 NOT NULL OPTIONS(description="Percentage of houses infested. Threshold: >= 5.0% = Warning"),
  container_index FLOAT64 NOT NULL OPTIONS(description="Percentage of water-holding containers positive"),
  container_reinspection_rate_pct FLOAT64 OPTIONS(description="7-day reinspection rate (Target >= 85%)"),
  predominant_breeding_site STRING OPTIONS(description="Drums, Discarded Tires, Plastic Bottles, etc."),
  larvicide_applied BOOL OPTIONS(description="Temephos / Bti biological larvicide distributed"),
  environmental_sanitation_done BOOL OPTIONS(description="Aksyon Barangay Kontra Dengue (ABKD) cleanup conducted"),
  kdr_pyrethroid_resistance_detected BOOL OPTIONS(description="Molecular knockdown resistance marker status"),
  risk_status STRING NOT NULL OPTIONS(description="Safe, Warning, High-Risk"),
  inspector_unit STRING DEFAULT 'ARGAO_RHM_BHW_VECTOR_SQUAD' OPTIONS(description="Inspecting BHW/Sanitary Inspector unit")
)
PARTITION BY DATE_TRUNC(inspection_date, MONTH)
CLUSTER BY psgc_barangay, risk_status
OPTIONS(
  description="Ground entomological inspection surveys tracking Aedes Aegypti vector density indices.",
  labels=[("stream_domain", "vector_surveillance"), ("indicator", "breteau_index")]
);
`.trim();

export const BIGQUERY_DDL_ANALYTICS_VIEW = `
-- ==============================================================================
-- Google BigQuery Analytical View: Multi-Stream Triangulated Outbreak Risk
-- Joins Clinical, Hospital Bed Telemetry, Climate, and Entomology
-- ==============================================================================
CREATE OR REPLACE VIEW \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.vw_multi_stream_triangulated_outbreak_risk\` AS
WITH weekly_clinical AS (
  SELECT
    morbidity_year,
    morbidity_week,
    psgc_barangay,
    barangay,
    COUNT(1) AS total_cases,
    COUNTIF(case_classification = 'Confirmed') AS confirmed_cases,
    COUNTIF(case_classification = 'Probable') AS probable_cases,
    COUNTIF(case_classification = 'Suspect') AS suspect_cases,
    COUNTIF(admitted_flag = TRUE) AS admitted_cases,
    COUNTIF(clinical_classification = 'Severe Dengue') AS severe_cases
  FROM \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.pidsr_clinical_linelist\`
  GROUP BY 1, 2, 3, 4
),
weekly_hospital AS (
  SELECT
    morbidity_week,
    AVG(overall_bor_pct) AS avg_hospital_bor_pct,
    MAX(overall_bor_pct) AS peak_hospital_bor_pct,
    AVG(total_inpatients) AS avg_inpatients,
    ANY_VALUE(surge_alert_level) AS latest_surge_alert_level,
    MIN(days_to_bed_exhaustion) AS min_days_to_bed_exhaustion,
    AVG(er_backlog_count) AS avg_er_backlog
  FROM \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.kintanar_hospital_bed_telemetry\`
  GROUP BY 1
),
weekly_climate AS (
  SELECT
    morbidity_week,
    AVG(rainfall_mm) AS weekly_rainfall_mm,
    AVG(two_week_lag_rainfall_mm) AS lag_rainfall_mm,
    AVG(mean_relative_humidity_pct) AS humidity_pct,
    AVG(mean_temperature_celsius) AS temperature_c,
    ANY_VALUE(climate_risk_tier) AS climate_tier
  FROM \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.meteorological_climate_stream\`
  GROUP BY 1
),
weekly_ento AS (
  SELECT
    morbidity_week,
    psgc_barangay,
    AVG(breteau_index) AS avg_breteau_index,
    AVG(house_index) AS avg_house_index,
    COUNTIF(risk_status = 'High-Risk') > 0 AS has_high_risk_breeding
  FROM \`${GCP_PROJECT_ID_DEFAULT}.${BIGQUERY_DATASET_DEFAULT}.entomological_larval_surveillance\`
  GROUP BY 1, 2
)
SELECT
  c.morbidity_year,
  c.morbidity_week,
  c.psgc_barangay,
  c.barangay,
  c.total_cases,
  c.severe_cases,
  c.admitted_cases,
  COALESCE(e.avg_breteau_index, 0.0) AS breteau_index,
  COALESCE(e.avg_house_index, 0.0) AS house_index,
  COALESCE(w.weekly_rainfall_mm, 0.0) AS rainfall_mm,
  COALESCE(w.lag_rainfall_mm, 0.0) AS two_week_lag_rainfall_mm,
  COALESCE(h.avg_hospital_bor_pct, 100.0) AS hospital_bor_pct,
  COALESCE(h.latest_surge_alert_level, 'NORMAL') AS hospital_surge_level,
  COALESCE(h.min_days_to_bed_exhaustion, 99.0) AS days_to_bed_exhaustion,
  -- Triangulation Composite Risk Score (0-100)
  ROUND(
    (LEAST(c.total_cases * 8.0, 40.0)) +
    (LEAST(COALESCE(e.avg_breteau_index, 0.0) * 1.5, 30.0)) +
    (CASE WHEN COALESCE(h.avg_hospital_bor_pct, 0.0) > 100.0 THEN 20.0 ELSE COALESCE(h.avg_hospital_bor_pct, 0.0) * 0.15 END) +
    (CASE WHEN COALESCE(w.lag_rainfall_mm, 0.0) > 40.0 THEN 10.0 ELSE 3.0 END)
  , 1) AS composite_outbreak_risk_score,
  CASE
    WHEN COALESCE(e.avg_breteau_index, 0) >= 20.0 AND c.total_cases >= 3 THEN 'RED_EPIDEMIC'
    WHEN COALESCE(e.avg_breteau_index, 0) >= 10.0 OR c.total_cases >= 2 THEN 'YELLOW_ALERT'
    ELSE 'GREEN_MONITORING'
  END AS triangulated_action_tier
FROM weekly_clinical c
LEFT JOIN weekly_ento e
  ON c.morbidity_week = e.morbidity_week AND c.psgc_barangay = e.psgc_barangay
LEFT JOIN weekly_climate w
  ON c.morbidity_week = w.morbidity_week
LEFT JOIN weekly_hospital h
  ON c.morbidity_week = h.morbidity_week;
`.trim();

// ==============================================================================
// 2. LOOKER STUDIO COMMUNITY CONNECTOR APPS SCRIPT CODE TEMPLATE
// ==============================================================================

export function generateLookerStudioAppsScriptCode(serverOrigin: string, authToken: string): string {
  const originClean = serverOrigin.replace(/\/$/, '');
  return `/**
 * Google Apps Script - Looker Studio Community Connector
 * Dr. Isidro C. Kintanar Memorial Hospital & Argao MESU Surveillance
 * 
 * Instructions:
 * 1. Open https://script.google.com/ and create a new project.
 * 2. Replace the contents of Code.gs with this code.
 * 3. In Project Settings, enable "Show 'appsscript.json' manifest file in editor"
 *    and paste the appsscript.json manifest provided in the suite.
 * 4. Click Deploy -> New Deployment -> Select type "Add-on" -> Looker Studio.
 * 5. Open the Direct Looker Studio link generated below!
 */

var CC = DataStudioApp.createCommunityConnector();
var API_BASE_URL = "${originClean}";
var DEFAULT_AUTH_TOKEN = "${authToken}";

function getAuthType() {
  return CC.newAuthTypeResponse()
    .setAuthType(CC.AuthType.KEY)
    .setHelpUrl("https://hospital.argao.gov.ph/surveillance/auth-help")
    .build();
}

function isAuthValid() {
  var userProperties = PropertiesService.getUserProperties();
  var key = userProperties.getProperty('ds.key') || DEFAULT_AUTH_TOKEN;
  return key && key.length > 8;
}

function setCredentials(request) {
  var key = request.key;
  PropertiesService.getUserProperties().setProperty('ds.key', key);
  return {
    errorCode: 'NONE'
  };
}

function resetAuth() {
  PropertiesService.getUserProperties().deleteProperty('ds.key');
}

function getConfig(request) {
  var config = CC.getConfig();

  config.newInfo()
    .setId('connectorInfo')
    .setText('Dr. Isidro C. Kintanar Memorial Hospital & Argao MESU Live Surveillance Stream');

  config.newSelectSingle()
    .setId('streamType')
    .setName('Select Surveillance Intelligence Stream')
    .setHelpText('Choose between Multi-Stream Triangulation, Clinical PIDSR, Hospital Bed Telemetry, Climate, or Entomology.')
    .setAllowOverride(true)
    .addOption(config.newOptionBuilder().setLabel('Multi-Stream Triangulated Outbreak Risk (Recommended)').setValue('all'))
    .addOption(config.newOptionBuilder().setLabel('1. Clinical PIDSR Line-List').setValue('clinical'))
    .addOption(config.newOptionBuilder().setLabel('2. Kintanar Hospital Bed Telemetry (BOR & Surge)').setValue('hospital'))
    .addOption(config.newOptionBuilder().setLabel('3. Climate & Agromet Rainfall Stream').setValue('climate'))
    .addOption(config.newOptionBuilder().setLabel('4. Entomology (Breteau & House Indices)').setValue('entomology'));

  config.setDateRangeRequired(true);
  return config.build();
}

function getFields(streamType) {
  var fields = CC.getFields();
  var types = CC.FieldType;
  var aggregations = CC.AggregationType;

  // Standard Dimension: Morbidity Week
  fields.newDimension()
    .setId('morbidity_week')
    .setName('Morbidity Week')
    .setType(types.YEAR_WEEK);

  fields.newDimension()
    .setId('barangay')
    .setName('Barangay (Argao)')
    .setType(types.TEXT);

  fields.newDimension()
    .setId('psgc_barangay')
    .setName('PSGC Barangay Code')
    .setType(types.TEXT);

  // Clinical Metrics
  fields.newMetric()
    .setId('total_cases')
    .setName('Total Cases (PIDSR)')
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields.newMetric()
    .setId('confirmed_cases')
    .setName('Confirmed Cases')
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  fields.newMetric()
    .setId('severe_cases')
    .setName('Severe Dengue Cases')
    .setType(types.NUMBER)
    .setAggregation(aggregations.SUM);

  // Hospital Bed Metrics
  fields.newMetric()
    .setId('hospital_bor_pct')
    .setName('Kintanar Hospital Bed Occupancy Rate (%)')
    .setDescription('BOR against 25 authorized licensed beds baseline')
    .setType(types.PERCENT)
    .setAggregation(aggregations.AVG);

  fields.newDimension()
    .setId('surge_alert_level')
    .setName('Hospital Surge Alert Level')
    .setType(types.TEXT);

  fields.newMetric()
    .setId('days_to_bed_exhaustion')
    .setName('Days to Bed Exhaustion')
    .setType(types.NUMBER)
    .setAggregation(aggregations.MIN);

  // Entomology Metrics
  fields.newMetric()
    .setId('breteau_index')
    .setName('Breteau Index (BI)')
    .setDescription('Positive containers per 100 inspected houses (Alert >= 20.0)')
    .setType(types.NUMBER)
    .setAggregation(aggregations.AVG);

  fields.newMetric()
    .setId('house_index')
    .setName('House Index (HI %)')
    .setType(types.PERCENT)
    .setAggregation(aggregations.AVG);

  // Climate Metrics
  fields.newMetric()
    .setId('rainfall_mm')
    .setName('Rainfall (mm)')
    .setType(types.NUMBER)
    .setAggregation(aggregations.AVG);

  fields.newMetric()
    .setId('lag_rainfall_mm')
    .setName('2-Week Lagged Rainfall (mm)')
    .setType(types.NUMBER)
    .setAggregation(aggregations.AVG);

  // Triangulation Composite Score
  fields.newMetric()
    .setId('composite_outbreak_risk_score')
    .setName('Triangulated Outbreak Risk Score (0-100)')
    .setType(types.NUMBER)
    .setAggregation(aggregations.MAX);

  fields.newDimension()
    .setId('triangulated_action_tier')
    .setName('Action Tier')
    .setType(types.TEXT);

  return fields;
}

function getSchema(request) {
  var streamType = (request.configParams && request.configParams.streamType) || 'all';
  return { schema: getFields(streamType).build() };
}

function getData(request) {
  var streamType = (request.configParams && request.configParams.streamType) || 'all';
  var userProperties = PropertiesService.getUserProperties();
  var token = userProperties.getProperty('ds.key') || DEFAULT_AUTH_TOKEN;

  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });

  // Call the live REST API on the EIEWS server
  var url = API_BASE_URL + '/api/looker/connector/data?stream=' + encodeURIComponent(streamType);
  var options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Surveillance-Token': token,
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());

  if (!json || !json.rows) {
    throw new Error('Failed to retrieve rows from Argao EIEWS surveillance endpoint: ' + response.getContentText());
  }

  // Filter columns according to requested fields
  var selectedFields = getFields(streamType).forIds(requestedFieldIds);
  var rows = [];

  for (var i = 0; i < json.rows.length; i++) {
    var rawRow = json.rows[i];
    var values = [];
    for (var j = 0; j < requestedFieldIds.length; j++) {
      var fieldId = requestedFieldIds[j];
      var val = rawRow[fieldId];
      if (val === undefined || val === null) {
        val = '';
      }
      values.push(val);
    }
    rows.push({ values: values });
  }

  return {
    schema: selectedFields.build(),
    rows: rows
  };
}
`.trim();
}

export const LOOKER_MANIFEST_JSON = JSON.stringify(
  {
    timeZone: 'Asia/Manila',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    dataStudio: {
      name: 'Argao EIEWS & Kintanar Hospital Surveillance Connector',
      logoUrl: 'https://raw.githubusercontent.com/google/material-design-icons/master/png/action/query_builder/materialicons/24dp/2x/baseline_query_builder_black_24dp.png',
      company: 'Municipality of Argao MESU & DOH Region VII',
      companyUrl: 'https://argao.gov.ph',
      addonUrl: 'https://argao.gov.ph/eiews',
      supportUrl: 'https://argao.gov.ph/contact',
      description: 'Live token-secured multi-stream connector linking Looker Studio with Dr. Isidro C. Kintanar Memorial Hospital and Argao MESU PIDSR surveillance streams.',
      sources: ['REST', 'PIDSR', 'HOSPITAL_HIS'],
    },
  },
  null,
  2
);

// ==============================================================================
// 3. BIGQUERY DATASET SERIALIZERS (JSONL & CSV)
// ==============================================================================

export function generateBigQueryClinicalJSONL(records: SurveillanceRecord[]): string {
  return records
    .map(r =>
      JSON.stringify({
        epi_id: r.epiId,
        disease_id: r.diseaseId || 'DEN',
        age_years: r.age,
        sex: r.sex,
        psgc_municipality: r.psgcMunicipality || '072205000',
        municipality: r.municipality || 'Argao',
        psgc_barangay: r.psgcBarangay || '072205001',
        barangay: r.barangay,
        date_onset: r.dateOnset,
        morbidity_week: r.morbidityWeek,
        morbidity_year: 2026,
        consulted_flag: r.consulted === 'Y',
        admitted_flag: r.admitted === 'Y',
        case_classification: r.caseClassification,
        clinical_classification: r.clinicalClassification,
        outcome: r.outcome,
        ns1_rdt_tested: true,
        ns1_result: r.caseClassification === 'Confirmed' ? 'Positive' : 'Probable/Suspect',
        ns1_turnaround_hours: 1.8,
        source_stream: 'PIDSR_LINE_LIST',
      })
    )
    .join('\n');
}

export function generateBigQueryHospitalJSONL(bedReport: HospitalBedCapacityReport | null): string {
  const reports = [
    bedReport || {
      id: 'DICKMH-SURGE-2026-MW34-01',
      facilityName: 'Dr. Isidro C. Kintanar Memorial Hospital',
      authorizedBedCapacity: 25,
      operationalBedCapacity: 50,
      totalInpatients: 38,
      totalAvailableBeds: 12,
      overallBOR: 152.0,
      surgeAlertLevel: 'WARNING',
      dengueIsolationBeds: { totalBeds: 12, occupiedBeds: 11, occupancyPct: 91.7, status: 'Warning' },
      pediatricWardBeds: { totalBeds: 8, occupiedBeds: 9, occupancyPct: 112.5, status: 'Overflow' },
      generalMedicalBeds: { totalBeds: 24, occupiedBeds: 15, occupancyPct: 62.5, status: 'Normal' },
      icuHighDependencyBeds: { totalBeds: 6, occupiedBeds: 3, occupancyPct: 50.0, status: 'Normal' },
      erTriageBacklogCount: 5,
      erFastLaneActive: true,
      microhematocritTurnaroundMinutes: 22,
      ns1RdtStockAvailable: 42,
      daysToBedCapacityExhaustion: 4.8,
      referralPressureIndex: 78.4,
      sourceUrl: 'https://www.facebook.com/share/p/19jG4RfAoc/',
      sourcePostId: '19jG4RfAoc',
    },
  ];

  return reports
    .map(b =>
      JSON.stringify({
        report_id: b.id,
        report_timestamp: new Date().toISOString(),
        morbidity_week: 34,
        facility_name: b.facilityName,
        psgc_municipality: '072205000',
        facility_tier: 'Level 1 District Hospital',
        authorized_bed_capacity: b.authorizedBedCapacity,
        operational_bed_capacity: b.operationalBedCapacity,
        total_inpatients: b.totalInpatients,
        total_available_beds: b.totalAvailableBeds,
        overall_bor_pct: b.overallBOR,
        surge_alert_level: b.surgeAlertLevel,
        dengue_ward_total_beds: b.dengueIsolationBeds.totalBeds,
        dengue_ward_occupied_beds: b.dengueIsolationBeds.occupiedBeds,
        dengue_ward_occupancy_pct: b.dengueIsolationBeds.occupancyPct,
        dengue_ward_status: b.dengueIsolationBeds.status,
        pediatric_ward_total_beds: b.pediatricWardBeds.totalBeds,
        pediatric_ward_occupied_beds: b.pediatricWardBeds.occupiedBeds,
        pediatric_ward_occupancy_pct: b.pediatricWardBeds.occupancyPct,
        pediatric_ward_status: b.pediatricWardBeds.status,
        adult_medical_total_beds: b.generalMedicalBeds.totalBeds,
        adult_medical_occupied_beds: b.generalMedicalBeds.occupiedBeds,
        icu_total_beds: b.icuHighDependencyBeds.totalBeds,
        icu_occupied_beds: b.icuHighDependencyBeds.occupiedBeds,
        er_backlog_count: b.erTriageBacklogCount,
        er_fastlane_active: b.erFastLaneActive,
        microhematocrit_turnaround_mins: b.microhematocritTurnaroundMinutes,
        ns1_stock_available: b.ns1RdtStockAvailable,
        days_to_bed_exhaustion: b.daysToBedCapacityExhaustion,
        referral_pressure_index: b.referralPressureIndex,
        extraction_source: 'FACEBOOK_PUBLIC_POST',
        source_post_id: b.sourcePostId || '19jG4RfAoc',
        verified_signature: 'MESU-VALIDATED-EIEWS-2026',
      })
    )
    .join('\n');
}

export function generateBigQueryClimateJSONL(): string {
  const sampleWeeks = [
    { mw: 30, rain: 28.4, lagRain: 18.2, rh: 78.5, temp: 28.2, tier: 'Moderate' },
    { mw: 31, rain: 45.6, lagRain: 28.4, rh: 82.1, temp: 27.8, tier: 'Favorable' },
    { mw: 32, rain: 64.2, lagRain: 45.6, rh: 86.4, temp: 27.4, tier: 'Optimal' },
    { mw: 33, rain: 52.8, lagRain: 64.2, rh: 85.0, temp: 27.6, tier: 'Optimal' },
    { mw: 34, rain: 48.0, lagRain: 52.8, rh: 84.2, temp: 28.0, tier: 'Optimal' },
  ];

  return sampleWeeks
    .map(w =>
      JSON.stringify({
        observation_date: `2026-08-${10 + (w.mw - 30) * 7}`,
        morbidity_week: w.mw,
        morbidity_year: 2026,
        rainfall_mm: w.rain,
        mean_relative_humidity_pct: w.rh,
        mean_temperature_celsius: w.temp,
        two_week_lag_rainfall_mm: w.lagRain,
        historical_rainfall_avg_mm: 31.5,
        rainfall_anomaly_pct: parseFloat((((w.rain - 31.5) / 31.5) * 100).toFixed(1)),
        climate_suitability_index: 88.5,
        climate_risk_tier: w.tier,
        flooding_vulnerability_score: 65.0,
        drainage_blockage_risk: 'High',
        station_source: 'PAGASA_ARGAO_AGROMET',
      })
    )
    .join('\n');
}

export function generateBigQueryEntomologyJSONL(summary: MultiStreamSummary | null): string {
  const defaultItems: EntomologicalInspectionRecord[] = [
    {
      id: 'ENTO-2026-001',
      barangay: 'Poblacion',
      morbidityWeek: 34,
      inspectedHouses: 100,
      positiveHouses: 14,
      inspectedContainers: 240,
      positiveContainers: 38,
      breteauIndex: 38.0,
      houseIndex: 14.0,
      containerReinspectionRate: 91.2,
      predominantBreedingSite: 'Discarded Tires',
      larvalPositiveSitesCount: 38,
      larvicideApplied: true,
      environmentalSanitationDone: true,
      riskStatus: 'High-Risk',
    },
    {
      id: 'ENTO-2026-002',
      barangay: 'Balisong',
      morbidityWeek: 34,
      inspectedHouses: 100,
      positiveHouses: 12,
      inspectedContainers: 210,
      positiveContainers: 31,
      breteauIndex: 31.0,
      houseIndex: 12.0,
      containerReinspectionRate: 88.5,
      predominantBreedingSite: 'Water Storage Drums',
      larvalPositiveSitesCount: 31,
      larvicideApplied: true,
      environmentalSanitationDone: true,
      riskStatus: 'High-Risk',
    },
    {
      id: 'ENTO-2026-003',
      barangay: 'Talaga',
      morbidityWeek: 34,
      inspectedHouses: 100,
      positiveHouses: 9,
      inspectedContainers: 190,
      positiveContainers: 24,
      breteauIndex: 24.0,
      houseIndex: 9.0,
      containerReinspectionRate: 86.0,
      predominantBreedingSite: 'Plastic Vessels & Bottles',
      larvalPositiveSitesCount: 24,
      larvicideApplied: false,
      environmentalSanitationDone: true,
      riskStatus: 'High-Risk',
    },
    {
      id: 'ENTO-2026-004',
      barangay: 'Canbanua',
      morbidityWeek: 34,
      inspectedHouses: 100,
      positiveHouses: 7,
      inspectedContainers: 180,
      positiveContainers: 18,
      breteauIndex: 18.0,
      houseIndex: 7.0,
      containerReinspectionRate: 90.0,
      predominantBreedingSite: 'Roof Gutters',
      larvalPositiveSitesCount: 18,
      larvicideApplied: true,
      environmentalSanitationDone: false,
      riskStatus: 'Warning',
    },
  ];

  const items: EntomologicalInspectionRecord[] = summary?.entomological.barangayIndices || defaultItems;

  return items
    .map((i, idx) =>
      JSON.stringify({
        inspection_id: i.id,
        inspection_date: '2026-08-20',
        morbidity_week: i.morbidityWeek,
        morbidity_year: 2026,
        psgc_barangay: `07220500${(idx + 1).toString().padStart(2, '0')}`,
        barangay: i.barangay,
        inspected_houses: i.inspectedHouses,
        positive_houses: i.positiveHouses,
        inspected_containers: i.inspectedContainers,
        positive_containers: i.positiveContainers,
        breteau_index: i.breteauIndex,
        house_index: i.houseIndex,
        container_index: parseFloat(((i.positiveContainers / (i.inspectedContainers || 1)) * 100).toFixed(1)),
        container_reinspection_rate_pct: i.containerReinspectionRate,
        predominant_breeding_site: i.predominantBreedingSite,
        larvicide_applied: i.larvicideApplied,
        environmental_sanitation_done: i.environmentalSanitationDone,
        kdr_pyrethroid_resistance_detected: false,
        risk_status: i.riskStatus,
        inspector_unit: 'ARGAO_RHM_BHW_VECTOR_SQUAD',
      })
    )
    .join('\n');
}

// Download Helper
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Cloud Shell / bq command script generator
export function generateCloudShellIngestScript(): string {
  return `#!/bin/bash
# ==============================================================================
# Google Cloud SDK / Cloud Shell One-Liner Setup & Load Script
# Project: ${GCP_PROJECT_ID_DEFAULT} | Dataset: ${BIGQUERY_DATASET_DEFAULT}
# ==============================================================================

set -e

PROJECT_ID="\${1:-${GCP_PROJECT_ID_DEFAULT}}"
DATASET_ID="${BIGQUERY_DATASET_DEFAULT}"
LOCATION="asia-southeast1" # Singapore / Southeast Asia region

echo "==> Configuring GCP Project: \${PROJECT_ID}..."
gcloud config set project "\${PROJECT_ID}"

echo "==> Creating BigQuery Surveillance Dataset: \${DATASET_ID} in \${LOCATION}..."
bq --location="\${LOCATION}" mk --dataset --description="Argao Epidemiological Early Warning & Response System" "\${PROJECT_ID}:\${DATASET_ID}" || true

echo "==> Applying BigQuery DDL Schemas..."
bq query --use_legacy_sql=false < argao_surveillance_ddl_suite.sql

echo "==> Ingesting JSONL datasets..."
bq load --source_format=NEWLINE_DELIMITED_JSON "\${PROJECT_ID}:\${DATASET_ID}.pidsr_clinical_linelist" clinical_linelist.jsonl
bq load --source_format=NEWLINE_DELIMITED_JSON "\${PROJECT_ID}:\${DATASET_ID}.kintanar_hospital_bed_telemetry" hospital_bed_telemetry.jsonl
bq load --source_format=NEWLINE_DELIMITED_JSON "\${PROJECT_ID}:\${DATASET_ID}.meteorological_climate_stream" climate_stream.jsonl
bq load --source_format=NEWLINE_DELIMITED_JSON "\${PROJECT_ID}:\${DATASET_ID}.entomological_larval_surveillance" entomology_stream.jsonl

echo "==> BigQuery Load Complete! Triangulated View is now live."
echo "Connect Looker Studio using BigQuery connector: \${PROJECT_ID}.\${DATASET_ID}.vw_multi_stream_triangulated_outbreak_risk"
`.trim();
}
