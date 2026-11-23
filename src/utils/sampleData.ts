/**
 * Standard Synthetic Surveillance Datasets
 * Dengue, Cholera, and Measles baseline surveillance records
 * Strictly localized to the Municipality of Argao, Cebu, Central Visayas [PSGC: 072205000]
 * Includes sample cross-border records to demonstrate territorial rejection gatekeeping.
 */

export const SAMPLE_CSV_CONTENT = `Disease ID,EPIID,Age at onset,Sex (M/F),PSGC_Municipality,Municipality (Current),PSGC_Barangay,Barangay (Current),Date Onset of First Symptoms,MW (Morbidity Week),Consulted (Y/N),Admitted (Y/N),Case Classification,Clinical Classification,Outcome
DEN,EPI-2026-0001,8,Male,072205000,Argao,072205001,Poblacion,2026-05-18,21,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0002,14,Female,072205000,Argao,072205001,Poblacion,2026-05-25,22,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0003,21,Male,072205000,Argao,072205002,Balisong,2026-06-02,23,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0004,5,Female,072205000,Argao,072205003,Talaga,2026-06-08,24,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0005,12,Male,072205000,Argao,072205004,Canbanua,2026-06-15,25,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0006,7,Female,072205000,Argao,072205001,Poblacion,2026-06-17,25,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0007,9,Male,072205000,Argao,072205002,Balisong,2026-06-22,26,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0008,16,Female,072205000,Argao,072205005,Lamacan,2026-06-24,26,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0009,4,Male,072205000,Argao,072205003,Talaga,2026-06-29,27,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0010,23,Female,072205000,Argao,072205001,Poblacion,2026-07-02,27,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0011,11,Male,072205000,Argao,072205006,Tulic,2026-07-06,28,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0012,8,Female,072205000,Argao,072205002,Balisong,2026-07-08,28,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0013,15,Male,072205000,Argao,072205007,Bogo,2026-07-10,28,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0014,6,Female,072205000,Argao,072205001,Poblacion,2026-07-13,29,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0015,10,Male,072205000,Argao,072205002,Balisong,2026-07-15,29,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0016,18,Female,072205000,Argao,072205004,Canbanua,2026-07-17,29,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0017,3,Male,072205000,Argao,072205003,Talaga,2026-07-18,29,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0018,13,Female,072205000,Argao,072205008,Binlod,2026-07-20,30,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0019,25,Male,072205000,Argao,072205001,Poblacion,2026-07-22,30,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0020,9,Female,072205000,Argao,072205002,Balisong,2026-07-23,30,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0021,7,Male,072205000,Argao,072205009,Casirad,2026-07-24,30,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0022,12,Female,072205000,Argao,072205010,Lengigon,2026-07-25,30,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0023,5,Male,072205000,Argao,072205001,Poblacion,2026-07-27,31,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0024,14,Female,072205000,Argao,072205002,Balisong,2026-07-28,31,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0025,8,Male,072205000,Argao,072205003,Talaga,2026-07-29,31,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0026,20,Female,072205000,Argao,072205004,Canbanua,2026-07-30,31,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0027,11,Male,072205000,Argao,072205011,Alambijud,2026-07-31,31,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0028,6,Female,072205000,Argao,072205012,Bulasa,2026-08-01,31,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0029,9,Male,072205000,Argao,072205001,Poblacion,2026-08-03,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0030,15,Female,072205000,Argao,072205002,Balisong,2026-08-04,32,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0031,4,Male,072205000,Argao,072205003,Talaga,2026-08-05,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0032,17,Female,072205000,Argao,072205004,Canbanua,2026-08-06,32,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0033,22,Male,072205000,Argao,072205005,Lamacan,2026-08-07,32,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0034,10,Female,072205000,Argao,072205013,Talu-ot,2026-08-08,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0035,13,Male,072205000,Argao,072205014,Colawin,2026-08-08,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0036,8,Female,072205000,Argao,072205001,Poblacion,2026-08-10,33,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0037,14,Male,072205000,Argao,072205001,Poblacion,2026-08-11,33,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0038,5,Female,072205000,Argao,072205002,Balisong,2026-08-11,33,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0039,22,Male,072205000,Argao,072205002,Balisong,2026-08-12,33,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0040,11,Female,072205000,Argao,072205003,Talaga,2026-08-13,33,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0041,9,Male,072205000,Argao,072205004,Canbanua,2026-08-14,33,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0042,3,Female,072205000,Argao,072205007,Bogo,2026-08-14,33,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0043,16,Male,072205000,Argao,072205008,Binlod,2026-08-15,33,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0044,12,Female,072205000,Argao,072205015,Panadtaran,2026-08-15,33,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0045,7,Male,072205000,Argao,072205001,Poblacion,2026-08-17,34,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0046,28,Female,072205000,Argao,072205002,Balisong,2026-08-18,34,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0047,6,Male,072205000,Argao,072205003,Talaga,2026-08-19,34,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0048,10,Female,072205000,Argao,072205004,Canbanua,2026-08-20,34,Y,Y,Probable,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0049,15,Male,072205000,Argao,072205006,Tulic,2026-08-21,34,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0050,4,Female,072205000,Argao,072205016,Guiwanon,2026-08-22,34,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0051,35,Male,072205000,Argao,072205001,Poblacion,2026-08-24,35,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0052,19,Female,072205000,Argao,072205002,Balisong,2026-08-25,35,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-0053,2,Male,072205000,Argao,072205003,Talaga,2026-08-26,35,Y,Y,Confirmed,Severe Dengue,Recovered
DEN,EPI-2026-0054,25,Female,072205000,Argao,072205004,Canbanua,2026-08-27,35,Y,N,Suspect,Dengue without Warning Signs,Alive
DEN,EPI-2026-0055,13,Male,072205000,Argao,072205017,Mandilikit,2026-08-28,35,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-X001,16,Female,072214000,Carcar City,072214001,Poblacion I,2026-08-10,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-X002,12,Male,072214000,Carcar City,072214002,Valladolid,2026-08-12,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-X003,10,Male,072251000,Sibonga,072251001,Poblacion,2026-08-11,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered
DEN,EPI-2026-X004,35,Female,072217000,Cebu City,072217001,Guadalupe,2026-08-05,31,Y,Y,Confirmed,Dengue without Warning Signs,Recovered
DEN,EPI-2026-X005,9,Male,072250000,San Fernando,072250001,Poblacion,2026-08-12,32,Y,Y,Confirmed,Dengue with Warning Signs,Recovered`;

export const SAMPLE_CHOLERA_CSV = `Disease ID,EPIID,Age at onset,Sex (M/F),PSGC_Municipality,Municipality (Current),PSGC_Barangay,Barangay (Current),Date Onset of First Symptoms,MW (Morbidity Week),Consulted (Y/N),Admitted (Y/N),Case Classification,Clinical Classification,Outcome
CHOL,CHOL-2026-001,34,Male,072205000,Argao,072205001,Poblacion,2026-07-14,29,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-002,28,Female,072205000,Argao,072205001,Poblacion,2026-07-20,30,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-003,5,Male,072205000,Argao,072205002,Balisong,2026-07-28,31,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-004,45,Female,072205000,Argao,072205003,Talaga,2026-08-04,32,Y,Y,Confirmed,Moderate Dehydration,Recovered
CHOL,CHOL-2026-005,12,Male,072205000,Argao,072205004,Canbanua,2026-08-11,33,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-006,52,Female,072205000,Argao,072205001,Poblacion,2026-08-12,33,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-007,19,Male,072205000,Argao,072205002,Balisong,2026-08-13,33,Y,Y,Probable,Moderate Dehydration,Recovered
CHOL,CHOL-2026-008,8,Female,072205000,Argao,072205007,Bogo,2026-08-14,33,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-009,23,Male,072205000,Argao,072205001,Poblacion,2026-08-18,34,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-010,31,Female,072205000,Argao,072205003,Talaga,2026-08-19,34,Y,Y,Confirmed,Moderate Dehydration,Recovered
CHOL,CHOL-2026-011,15,Male,072205000,Argao,072205004,Canbanua,2026-08-20,34,Y,Y,Probable,Moderate Dehydration,Recovered
CHOL,CHOL-2026-012,41,Female,072205000,Argao,072205002,Balisong,2026-08-25,35,Y,Y,Confirmed,Severe Dehydration,Recovered
CHOL,CHOL-2026-X01,34,Male,072217000,Cebu City,072217003,Pasil,2026-08-18,33,Y,Y,Confirmed,Severe Dehydration,Recovered`;

export const SAMPLE_MEASLES_CSV = `Disease ID,EPIID,Age at onset,Sex (M/F),PSGC_Municipality,Municipality (Current),PSGC_Barangay,Barangay (Current),Date Onset of First Symptoms,MW (Morbidity Week),Consulted (Y/N),Admitted (Y/N),Case Classification,Clinical Classification,Outcome
MEA,MEA-2026-001,2,Female,072205000,Argao,072205001,Poblacion,2026-06-23,26,Y,Y,Confirmed,Measles with Pneumonia,Recovered
MEA,MEA-2026-002,1,Male,072205000,Argao,072205005,Lamacan,2026-07-07,28,Y,Y,Confirmed,Uncomplicated Measles,Recovered
MEA,MEA-2026-003,4,Female,072205000,Argao,072205006,Tulic,2026-07-21,30,Y,Y,Confirmed,Uncomplicated Measles,Recovered
MEA,MEA-2026-004,3,Male,072205000,Argao,072205001,Poblacion,2026-08-04,32,Y,Y,Confirmed,Measles with Croup,Recovered
MEA,MEA-2026-005,5,Female,072205000,Argao,072205002,Balisong,2026-08-11,33,Y,Y,Confirmed,Measles with Otitis Media,Recovered
MEA,MEA-2026-006,2,Male,072205000,Argao,072205001,Poblacion,2026-08-12,33,Y,Y,Confirmed,Uncomplicated Measles,Recovered
MEA,MEA-2026-007,6,Female,072205000,Argao,072205003,Talaga,2026-08-18,34,Y,Y,Confirmed,Measles with Pneumonia,Recovered
MEA,MEA-2026-008,1,Male,072205000,Argao,072205010,Lengigon,2026-08-25,35,Y,Y,Confirmed,Uncomplicated Measles,Recovered
MEA,MEA-2026-X01,2,Female,072214000,Carcar City,072214001,Poblacion I,2026-08-10,32,Y,Y,Confirmed,Measles with Pneumonia,Recovered`;

export const BLANK_TEMPLATE_CSV = `Disease ID,EPIID,Age at onset,Sex (M/F),PSGC_Municipality,Municipality (Current),PSGC_Barangay,Barangay (Current),Date Onset of First Symptoms,MW (Morbidity Week),Consulted (Y/N),Admitted (Y/N),Case Classification,Clinical Classification,Outcome
DEN,EPI-2026-0001,15,Male,072205000,Argao,072205001,Poblacion,2026-08-20,34,Y,Y,Confirmed,Dengue with Warning Signs,Recovered`;

export function triggerCSVDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
