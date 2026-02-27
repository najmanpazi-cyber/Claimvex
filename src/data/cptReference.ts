export interface CptInfo {
  descriptor: string;
  category: string;
  globalDays: 0 | 10 | 90 | null; // null = N/A (injections, E/M, etc.)
  rvu: number | null;
}

export interface ModifierInfo {
  name: string;
  definition: string;
  commonUse: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CPT REFERENCE TABLE
// Source: AMA CPT descriptors (paraphrased), CMS 2024 wRVU values
// Covers: Orthopedics, Sports Medicine, Spine, Pain Management
// ─────────────────────────────────────────────────────────────────────────────
export const CPT_REFERENCE: Record<string, CptInfo> = {

  // ── E/M Office Visits ──────────────────────────────────────────────────────
  "99202": { descriptor: "Office visit, new patient, straightforward MDM (15-29 min)", category: "E/M", globalDays: null, rvu: 0.93 },
  "99203": { descriptor: "Office visit, new patient, low MDM (30-44 min)", category: "E/M", globalDays: null, rvu: 1.60 },
  "99204": { descriptor: "Office visit, new patient, moderate MDM (45-59 min)", category: "E/M", globalDays: null, rvu: 2.60 },
  "99205": { descriptor: "Office visit, new patient, high MDM (60-74 min)", category: "E/M", globalDays: null, rvu: 3.50 },
  "99211": { descriptor: "Office visit, established patient, minimal (nurse visit)", category: "E/M", globalDays: null, rvu: 0.18 },
  "99212": { descriptor: "Office visit, established patient, straightforward MDM (10-19 min)", category: "E/M", globalDays: null, rvu: 0.70 },
  "99213": { descriptor: "Office visit, established patient, low MDM (20-29 min)", category: "E/M", globalDays: null, rvu: 1.30 },
  "99214": { descriptor: "Office visit, established patient, moderate MDM (30-39 min)", category: "E/M", globalDays: null, rvu: 1.92 },
  "99215": { descriptor: "Office visit, established patient, high MDM (40-54 min)", category: "E/M", globalDays: null, rvu: 2.80 },

  // ── Joint Injections ───────────────────────────────────────────────────────
  "20600": { descriptor: "Arthrocentesis/injection, small joint (finger, toe)", category: "Musculoskeletal", globalDays: 0, rvu: 0.58 },
  "20604": { descriptor: "Arthrocentesis/injection, small joint, with ultrasound guidance", category: "Musculoskeletal", globalDays: 0, rvu: 0.79 },
  "20605": { descriptor: "Arthrocentesis/injection, intermediate joint (wrist, elbow, ankle)", category: "Musculoskeletal", globalDays: 0, rvu: 0.67 },
  "20606": { descriptor: "Arthrocentesis/injection, intermediate joint, with ultrasound guidance", category: "Musculoskeletal", globalDays: 0, rvu: 0.92 },
  "20610": { descriptor: "Arthrocentesis/injection, major joint (shoulder, hip, knee)", category: "Musculoskeletal", globalDays: 0, rvu: 0.77 },
  "20611": { descriptor: "Arthrocentesis/injection, major joint, with ultrasound guidance", category: "Musculoskeletal", globalDays: 0, rvu: 1.08 },
  "20615": { descriptor: "Aspiration and injection, bone cyst", category: "Musculoskeletal", globalDays: 10, rvu: 1.36 },

  // ── Trigger Point / Soft Tissue ────────────────────────────────────────────
  "20550": { descriptor: "Injection, single tendon sheath or ligament", category: "Musculoskeletal", globalDays: 0, rvu: 0.55 },
  "20551": { descriptor: "Injection, single tendon origin/insertion", category: "Musculoskeletal", globalDays: 0, rvu: 0.55 },
  "20552": { descriptor: "Injection, trigger point(s), 1-2 muscles", category: "Musculoskeletal", globalDays: 0, rvu: 0.53 },
  "20553": { descriptor: "Injection, trigger point(s), 3 or more muscles", category: "Musculoskeletal", globalDays: 0, rvu: 0.67 },

  // ── Bone Grafts (Add-ons) ──────────────────────────────────────────────────
  "20900": { descriptor: "Bone graft, any donor area — minor or small", category: "Musculoskeletal", globalDays: null, rvu: 2.34 },
  "20902": { descriptor: "Bone graft, any donor area — major or large", category: "Musculoskeletal", globalDays: null, rvu: 4.07 },
  "+20930": { descriptor: "ADD-ON: Morselized allograft for spine surgery", category: "Spine Add-on", globalDays: null, rvu: 0.85 },
  "+20931": { descriptor: "ADD-ON: Structural allograft for spine surgery", category: "Spine Add-on", globalDays: null, rvu: 1.18 },
  "20936": { descriptor: "ADD-ON: Autograft — local (e.g., spinous process, ribs, local bone)", category: "Spine Add-on", globalDays: null, rvu: 1.20 },
  "20937": { descriptor: "ADD-ON: Autograft — morselized (separate incision)", category: "Spine Add-on", globalDays: null, rvu: 3.01 },
  "20938": { descriptor: "ADD-ON: Autograft — structural, bicortical or tricortical (separate incision)", category: "Spine Add-on", globalDays: null, rvu: 5.02 },

  // ── Knee Arthroscopy ───────────────────────────────────────────────────────
  "29870": { descriptor: "Arthroscopy, knee, diagnostic, with or without synovial biopsy", category: "Arthroscopy", globalDays: 90, rvu: 3.88 },
  "29871": { descriptor: "Arthroscopy, knee, surgical — infection, lavage and drainage", category: "Arthroscopy", globalDays: 90, rvu: 5.32 },
  "29873": { descriptor: "Arthroscopy, knee, surgical — lateral release", category: "Arthroscopy", globalDays: 90, rvu: 5.21 },
  "29874": { descriptor: "Arthroscopy, knee, surgical — removal of loose body or foreign body", category: "Arthroscopy", globalDays: 90, rvu: 5.21 },
  "29875": { descriptor: "Arthroscopy, knee, surgical — synovectomy, limited", category: "Arthroscopy", globalDays: 90, rvu: 5.40 },
  "29876": { descriptor: "Arthroscopy, knee, surgical — synovectomy, major, 2+ compartments", category: "Arthroscopy", globalDays: 90, rvu: 7.73 },
  "29877": { descriptor: "Arthroscopy, knee, surgical — debridement/shaving of articular cartilage", category: "Arthroscopy", globalDays: 90, rvu: 5.60 },
  "29879": { descriptor: "Arthroscopy, knee, surgical — abrasion arthroplasty or multiple drilling/microfracture", category: "Arthroscopy", globalDays: 90, rvu: 6.50 },
  "29880": { descriptor: "Arthroscopy, knee, surgical — meniscectomy, medial AND lateral, including any meniscal shaving", category: "Arthroscopy", globalDays: 90, rvu: 7.17 },
  "29881": { descriptor: "Arthroscopy, knee, surgical — meniscectomy, medial OR lateral, including any meniscal shaving", category: "Arthroscopy", globalDays: 90, rvu: 6.48 },
  "29882": { descriptor: "Arthroscopy, knee, surgical — meniscus repair, medial OR lateral", category: "Arthroscopy", globalDays: 90, rvu: 9.76 },
  "29883": { descriptor: "Arthroscopy, knee, surgical — meniscus repair, medial AND lateral", category: "Arthroscopy", globalDays: 90, rvu: 12.16 },
  "29884": { descriptor: "Arthroscopy, knee, surgical — lysis of adhesions, with or without manipulation", category: "Arthroscopy", globalDays: 90, rvu: 6.34 },
  "29885": { descriptor: "Arthroscopy, knee, surgical — drilling for osteochondritis dissecans, with bone grafting", category: "Arthroscopy", globalDays: 90, rvu: 8.93 },
  "29886": { descriptor: "Arthroscopy, knee, surgical — drilling for intact osteochondritis dissecans lesion", category: "Arthroscopy", globalDays: 90, rvu: 7.20 },
  "29887": { descriptor: "Arthroscopy, knee, surgical — drilling for osteochondritis dissecans with internal fixation", category: "Arthroscopy", globalDays: 90, rvu: 9.54 },
  "+29999": { descriptor: "ADD-ON: Unlisted procedure, arthroscopy (used for distinct simultaneous arthroscopic procedures)", category: "Arthroscopy Add-on", globalDays: null, rvu: null },
  "+27358": { descriptor: "ADD-ON: Chondroplasty of knee — performed with meniscectomy", category: "Knee Add-on", globalDays: null, rvu: 1.41 },

  // ── Knee Open Procedures ───────────────────────────────────────────────────
  "27330": { descriptor: "Arthrotomy, knee; with exploration, drainage, or removal of foreign body", category: "Musculoskeletal", globalDays: 90, rvu: 7.21 },
  "27331": { descriptor: "Arthrotomy, knee; with synovectomy or synovial biopsy", category: "Musculoskeletal", globalDays: 90, rvu: 9.74 },
  "27380": { descriptor: "Suture of infrapatellar tendon — primary", category: "Musculoskeletal", globalDays: 90, rvu: 9.88 },
  "27381": { descriptor: "Suture of infrapatellar tendon — secondary reconstruction", category: "Musculoskeletal", globalDays: 90, rvu: 14.07 },
  "27405": { descriptor: "Repair, primary, torn ligament or capsule, knee; collateral", category: "Musculoskeletal", globalDays: 90, rvu: 11.82 },
  "27407": { descriptor: "Repair, primary, torn ligament or capsule, knee; cruciate (ACL/PCL)", category: "Musculoskeletal", globalDays: 90, rvu: 14.21 },
  "27409": { descriptor: "Repair, primary, torn ligament or capsule, knee; collateral AND cruciate", category: "Musculoskeletal", globalDays: 90, rvu: 19.75 },
  "27427": { descriptor: "Ligamentous reconstruction, knee; extra-articular", category: "Musculoskeletal", globalDays: 90, rvu: 13.19 },
  "27428": { descriptor: "Ligamentous reconstruction, knee; intra-articular (ACL reconstruction)", category: "Musculoskeletal", globalDays: 90, rvu: 17.85 },
  "27429": { descriptor: "Ligamentous reconstruction, knee; intra-articular AND extra-articular", category: "Musculoskeletal", globalDays: 90, rvu: 21.43 },
  "27447": { descriptor: "Total knee arthroplasty (TKA) — with or without patella resurfacing", category: "Musculoskeletal", globalDays: 90, rvu: 22.16 },
  "27486": { descriptor: "Revision of total knee arthroplasty — 1 component", category: "Musculoskeletal", globalDays: 90, rvu: 26.41 },
  "27487": { descriptor: "Revision of total knee arthroplasty — femoral and entire tibial component", category: "Musculoskeletal", globalDays: 90, rvu: 32.10 },

  // ── Hip ───────────────────────────────────────────────────────────────────
  "27130": { descriptor: "Total hip arthroplasty (THA) — with prosthetic femoral head replacement", category: "Musculoskeletal", globalDays: 90, rvu: 22.70 },
  "27132": { descriptor: "Conversion of previous hip surgery to total hip arthroplasty", category: "Musculoskeletal", globalDays: 90, rvu: 29.48 },
  "27134": { descriptor: "Revision, total hip arthroplasty — both components, with or without autograft/allograft", category: "Musculoskeletal", globalDays: 90, rvu: 36.52 },
  "29860": { descriptor: "Arthroscopy, hip, diagnostic with or without synovial biopsy", category: "Arthroscopy", globalDays: 90, rvu: 7.06 },
  "29861": { descriptor: "Arthroscopy, hip, surgical — removal of loose body or foreign body", category: "Arthroscopy", globalDays: 90, rvu: 9.42 },
  "29862": { descriptor: "Arthroscopy, hip, surgical — chondroplasty, including any synovial biopsy", category: "Arthroscopy", globalDays: 90, rvu: 11.37 },
  "29863": { descriptor: "Arthroscopy, hip, surgical — synovectomy", category: "Arthroscopy", globalDays: 90, rvu: 13.94 },

  // ── Shoulder Arthroscopy ───────────────────────────────────────────────────
  "29800": { descriptor: "Arthroscopy, temporomandibular joint, diagnostic", category: "Arthroscopy", globalDays: 90, rvu: 4.52 },
  "29805": { descriptor: "Arthroscopy, shoulder, diagnostic, with or without synovial biopsy", category: "Arthroscopy", globalDays: 90, rvu: 4.27 },
  "29806": { descriptor: "Arthroscopy, shoulder, surgical — capsulorrhaphy (instability repair)", category: "Arthroscopy", globalDays: 90, rvu: 13.81 },
  "29807": { descriptor: "Arthroscopy, shoulder, surgical — repair of SLAP lesion", category: "Arthroscopy", globalDays: 90, rvu: 12.43 },
  "29819": { descriptor: "Arthroscopy, shoulder, surgical — removal of loose body or foreign body", category: "Arthroscopy", globalDays: 90, rvu: 6.57 },
  "29820": { descriptor: "Arthroscopy, shoulder, surgical — synovectomy, partial", category: "Arthroscopy", globalDays: 90, rvu: 6.96 },
  "29821": { descriptor: "Arthroscopy, shoulder, surgical — synovectomy, complete", category: "Arthroscopy", globalDays: 90, rvu: 9.63 },
  "29822": { descriptor: "Arthroscopy, shoulder, surgical — debridement, limited", category: "Arthroscopy", globalDays: 90, rvu: 6.39 },
  "29823": { descriptor: "Arthroscopy, shoulder, surgical — debridement, extensive", category: "Arthroscopy", globalDays: 90, rvu: 7.99 },
  "29824": { descriptor: "Arthroscopy, shoulder, surgical — distal claviculectomy including AC joint", category: "Arthroscopy", globalDays: 90, rvu: 8.45 },
  "29825": { descriptor: "Arthroscopy, shoulder, surgical — lysis and resection of adhesions (frozen shoulder)", category: "Arthroscopy", globalDays: 90, rvu: 7.61 },
  "29826": { descriptor: "Arthroscopy, shoulder, surgical — decompression of subacromial space (acromioplasty)", category: "Arthroscopy", globalDays: 90, rvu: 6.81 },
  "29827": { descriptor: "Arthroscopy, shoulder, surgical — rotator cuff repair", category: "Arthroscopy", globalDays: 90, rvu: 15.30 },
  "29828": { descriptor: "Arthroscopy, shoulder, surgical — biceps tenodesis", category: "Arthroscopy", globalDays: 90, rvu: 10.62 },

  // ── Shoulder Open ─────────────────────────────────────────────────────────
  "23410": { descriptor: "Repair of ruptured musculotendinous cuff (rotator cuff), acute", category: "Musculoskeletal", globalDays: 90, rvu: 14.88 },
  "23412": { descriptor: "Repair of ruptured musculotendinous cuff (rotator cuff), chronic", category: "Musculoskeletal", globalDays: 90, rvu: 16.48 },
  "23472": { descriptor: "Arthroplasty, glenohumeral joint — total shoulder (glenoid and proximal humerus)", category: "Musculoskeletal", globalDays: 90, rvu: 21.24 },
  "23473": { descriptor: "Revision, total shoulder arthroplasty — humeral or glenoid component", category: "Musculoskeletal", globalDays: 90, rvu: 27.10 },

  // ── Ankle Arthroscopy ──────────────────────────────────────────────────────
  "29894": { descriptor: "Arthroscopy, ankle, surgical — removal of loose body or foreign body", category: "Arthroscopy", globalDays: 90, rvu: 7.12 },
  "29895": { descriptor: "Arthroscopy, ankle, surgical — synovectomy, partial", category: "Arthroscopy", globalDays: 90, rvu: 7.82 },
  "29897": { descriptor: "Arthroscopy, ankle, surgical — debridement, limited", category: "Arthroscopy", globalDays: 90, rvu: 7.45 },
  "29898": { descriptor: "Arthroscopy, ankle, surgical — debridement, extensive", category: "Arthroscopy", globalDays: 90, rvu: 8.90 },

  // ── Achilles / Foot / Ankle ────────────────────────────────────────────────
  "27650": { descriptor: "Repair, primary, open or percutaneous, ruptured Achilles tendon", category: "Musculoskeletal", globalDays: 90, rvu: 12.40 },
  "27652": { descriptor: "Repair, primary, open or percutaneous, ruptured Achilles tendon; with graft", category: "Musculoskeletal", globalDays: 90, rvu: 15.62 },
  "28285": { descriptor: "Correction, hammertoe (e.g., interphalangeal fusion, partial or total phalangectomy)", category: "Musculoskeletal", globalDays: 90, rvu: 5.01 },
  "28296": { descriptor: "Correction, hallux valgus (bunion) — with sesamoidectomy, when performed", category: "Musculoskeletal", globalDays: 90, rvu: 9.37 },

  // ── Fracture Care ──────────────────────────────────────────────────────────
  "25600": { descriptor: "Closed treatment, distal radial fracture (Colles or Smith type), without manipulation", category: "Musculoskeletal", globalDays: 90, rvu: 3.29 },
  "25605": { descriptor: "Closed treatment, distal radial fracture, with manipulation", category: "Musculoskeletal", globalDays: 90, rvu: 5.37 },
  "25607": { descriptor: "Open treatment, distal radial fracture, with internal fixation of 2 fragments", category: "Musculoskeletal", globalDays: 90, rvu: 13.53 },
  "25608": { descriptor: "Open treatment, distal radial fracture, with internal fixation of 3 fragments", category: "Musculoskeletal", globalDays: 90, rvu: 16.50 },
  "25609": { descriptor: "Open treatment, distal radial fracture, with internal fixation of 4+ fragments", category: "Musculoskeletal", globalDays: 90, rvu: 19.27 },
  "27750": { descriptor: "Closed treatment, tibial shaft fracture, without manipulation", category: "Musculoskeletal", globalDays: 90, rvu: 4.31 },
  "27752": { descriptor: "Closed treatment, tibial shaft fracture, with manipulation", category: "Musculoskeletal", globalDays: 90, rvu: 6.88 },
  "27758": { descriptor: "Open treatment, tibial shaft fracture, with plate/screws", category: "Musculoskeletal", globalDays: 90, rvu: 18.46 },
  "27759": { descriptor: "Treatment, tibial shaft fracture, by intramedullary nail (IM rod)", category: "Musculoskeletal", globalDays: 90, rvu: 17.72 },

  // ── Spine Surgery ──────────────────────────────────────────────────────────
  "22551": { descriptor: "ACDF — arthrodesis, anterior interbody, cervical below C2; single interspace", category: "Spine", globalDays: 90, rvu: 21.53 },
  "+22552": { descriptor: "ADD-ON: ACDF — arthrodesis, each additional interspace (cervical)", category: "Spine Add-on", globalDays: null, rvu: 8.04 },
  "22554": { descriptor: "Arthrodesis, posterior or posterolateral technique, cervical below C2; single level", category: "Spine", globalDays: 90, rvu: 18.72 },
  "22558": { descriptor: "Arthrodesis, anterior interbody technique, lumbar (ALIF); single interspace", category: "Spine", globalDays: 90, rvu: 21.93 },
  "22612": { descriptor: "Arthrodesis, posterior or posterolateral technique, lumbar; single interspace", category: "Spine", globalDays: 90, rvu: 19.60 },
  "+22614": { descriptor: "ADD-ON: Arthrodesis, posterior/posterolateral technique; each additional interspace", category: "Spine Add-on", globalDays: null, rvu: 9.11 },
  "22630": { descriptor: "PLIF — arthrodesis, posterior interbody technique, lumbar; single interspace", category: "Spine", globalDays: 90, rvu: 22.52 },
  "+22632": { descriptor: "ADD-ON: PLIF — each additional interspace", category: "Spine Add-on", globalDays: null, rvu: 10.23 },
  "22633": { descriptor: "TLIF — arthrodesis, combined posterior or posterolateral and PLIF technique, lumbar; single interspace", category: "Spine", globalDays: 90, rvu: 27.04 },
  "63030": { descriptor: "Laminotomy with discectomy — lumbar, single interspace (microdiscectomy)", category: "Spine", globalDays: 90, rvu: 16.36 },
  "+63035": { descriptor: "ADD-ON: Laminotomy with discectomy — each additional interspace", category: "Spine Add-on", globalDays: null, rvu: 7.57 },
  "63047": { descriptor: "Laminectomy, facetectomy, and foraminotomy — lumbar, single vertebral segment", category: "Spine", globalDays: 90, rvu: 19.09 },
  "+63048": { descriptor: "ADD-ON: Laminectomy, facetectomy, and foraminotomy — each additional segment", category: "Spine Add-on", globalDays: null, rvu: 8.34 },
  "63056": { descriptor: "Transpedicular approach, with decompression of spinal cord and/or nerve root(s), lumbar; single segment", category: "Spine", globalDays: 90, rvu: 19.85 },
  "+22842": { descriptor: "ADD-ON: Posterior segmental instrumentation (pedicle screws); 3-6 vertebral segments", category: "Spine Add-on", globalDays: null, rvu: 10.58 },
  "+22843": { descriptor: "ADD-ON: Posterior segmental instrumentation; 7-12 vertebral segments", category: "Spine Add-on", globalDays: null, rvu: 13.66 },
  "+22844": { descriptor: "ADD-ON: Posterior segmental instrumentation; 13+ vertebral segments", category: "Spine Add-on", globalDays: null, rvu: 16.74 },
  "+22851": { descriptor: "ADD-ON: Application of intervertebral biomechanical device(s) to bone (cage/PEEK) — per interspace", category: "Spine Add-on", globalDays: null, rvu: 3.54 },
  "+22853": { descriptor: "ADD-ON: Insertion of interbody biomechanical device(s), lordotic curve preserving — per interspace", category: "Spine Add-on", globalDays: null, rvu: 3.88 },

  // ── Epidural Steroid Injections ────────────────────────────────────────────
  "62320": { descriptor: "Injection, cervical or thoracic — interlaminar epidural (without imaging guidance)", category: "Pain Management", globalDays: null, rvu: 2.39 },
  "62321": { descriptor: "Injection, cervical or thoracic — interlaminar epidural, with imaging guidance (fluoroscopy or CT)", category: "Pain Management", globalDays: null, rvu: 3.07 },
  "62322": { descriptor: "Injection, lumbar or sacral — interlaminar epidural (without imaging guidance)", category: "Pain Management", globalDays: null, rvu: 2.14 },
  "62323": { descriptor: "Injection, lumbar or sacral — interlaminar epidural, with imaging guidance (fluoroscopy or CT)", category: "Pain Management", globalDays: null, rvu: 2.75 },
  "64479": { descriptor: "Injection, anesthetic/steroid, transforaminal — cervical or thoracic, single level (includes imaging)", category: "Pain Management", globalDays: null, rvu: 3.24 },
  "+64480": { descriptor: "ADD-ON: Transforaminal ESI — each additional cervical/thoracic level", category: "Pain Management Add-on", globalDays: null, rvu: 1.93 },
  "64483": { descriptor: "Injection, anesthetic/steroid, transforaminal — lumbar or sacral, single level (includes imaging)", category: "Pain Management", globalDays: null, rvu: 3.17 },
  "+64484": { descriptor: "ADD-ON: Transforaminal ESI — each additional lumbar/sacral level", category: "Pain Management Add-on", globalDays: null, rvu: 1.87 },

  // ── Facet Joint Injections ─────────────────────────────────────────────────
  "64490": { descriptor: "Injection, facet joint — cervical or thoracic, single level (includes imaging)", category: "Pain Management", globalDays: null, rvu: 2.56 },
  "+64491": { descriptor: "ADD-ON: Facet injection — second cervical/thoracic level", category: "Pain Management Add-on", globalDays: null, rvu: 1.29 },
  "+64492": { descriptor: "ADD-ON: Facet injection — third and additional cervical/thoracic level", category: "Pain Management Add-on", globalDays: null, rvu: 1.22 },
  "64493": { descriptor: "Injection, facet joint — lumbar or sacral, single level (includes imaging)", category: "Pain Management", globalDays: null, rvu: 2.43 },
  "+64494": { descriptor: "ADD-ON: Facet injection — second lumbar/sacral level", category: "Pain Management Add-on", globalDays: null, rvu: 1.19 },
  "+64495": { descriptor: "ADD-ON: Facet injection — third and additional lumbar/sacral level", category: "Pain Management Add-on", globalDays: null, rvu: 1.14 },

  // ── Radiofrequency Ablation ────────────────────────────────────────────────
  "64633": { descriptor: "Destruction by neurolytic agent, paravertebral facet joint nerve — cervical or thoracic, single level", category: "Pain Management", globalDays: null, rvu: 4.43 },
  "+64634": { descriptor: "ADD-ON: RFA — each additional cervical/thoracic level", category: "Pain Management Add-on", globalDays: null, rvu: 2.18 },
  "64635": { descriptor: "Destruction by neurolytic agent, paravertebral facet joint nerve — lumbar or sacral, single level", category: "Pain Management", globalDays: null, rvu: 4.26 },
  "+64636": { descriptor: "ADD-ON: RFA — each additional lumbar/sacral level", category: "Pain Management Add-on", globalDays: null, rvu: 2.07 },

  // ── SI Joint ──────────────────────────────────────────────────────────────
  "27096": { descriptor: "Injection procedure for sacroiliac joint, fluoroscopic guidance required", category: "Pain Management", globalDays: null, rvu: 2.11 },

  // ── Spinal Cord Stimulator ─────────────────────────────────────────────────
  "63650": { descriptor: "Percutaneous implantation of neurostimulator electrode array — epidural (SCS trial)", category: "Pain Management", globalDays: 10, rvu: 5.52 },
  "63655": { descriptor: "Laminectomy for implantation of neurostimulator electrodes — plate/paddle lead", category: "Pain Management", globalDays: 90, rvu: 14.77 },
  "63685": { descriptor: "Insertion or replacement of spinal neurostimulator pulse generator or receiver", category: "Pain Management", globalDays: 90, rvu: 8.29 },

  // ── Nerve Blocks ──────────────────────────────────────────────────────────
  "64415": { descriptor: "Injection, anesthetic agent — brachial plexus nerve", category: "Pain Management", globalDays: null, rvu: 1.89 },
  "64447": { descriptor: "Injection, anesthetic agent — femoral nerve, single", category: "Pain Management", globalDays: null, rvu: 1.63 },
  "64450": { descriptor: "Injection, anesthetic agent — other peripheral nerve or branch", category: "Pain Management", globalDays: null, rvu: 1.10 },

  // ── Imaging Guidance ──────────────────────────────────────────────────────
  "77003": { descriptor: "Fluoroscopic guidance for needle placement — spine or paraspinous diagnostic/therapeutic injection", category: "Radiology", globalDays: null, rvu: 0.93 },
  "76942": { descriptor: "Ultrasonic guidance for needle placement — imaging supervision and interpretation", category: "Radiology", globalDays: null, rvu: 0.77 },
  "77021": { descriptor: "Magnetic resonance guidance for needle placement — imaging supervision and interpretation", category: "Radiology", globalDays: null, rvu: 1.87 },

  // ── Casting / Splinting ────────────────────────────────────────────────────
  "29505": { descriptor: "Long leg splint, thigh to ankle or toes", category: "Casting", globalDays: 0, rvu: 1.48 },
  "29515": { descriptor: "Short leg splint, below knee to toes", category: "Casting", globalDays: 0, rvu: 1.16 },
  "29540": { descriptor: "Strapping, ankle and/or foot", category: "Casting", globalDays: 0, rvu: 0.55 },
  "29550": { descriptor: "Strapping, toes", category: "Casting", globalDays: 0, rvu: 0.40 },
};

// ─────────────────────────────────────────────────────────────────────────────
// MODIFIER REFERENCE TABLE
// ─────────────────────────────────────────────────────────────────────────────
export const MODIFIER_REFERENCE: Record<string, ModifierInfo> = {
  "22":  { name: "Increased Procedural Services", definition: "Work required to provide service is substantially greater than typically required.", commonUse: "Unusually complex case, documented extended operative time or difficulty." },
  "24":  { name: "Unrelated E/M During Post-op Period", definition: "Unrelated evaluation and management service by same physician during post-op period.", commonUse: "Patient in 90-day global presents with unrelated problem." },
  "25":  { name: "Significant, Separately Identifiable E/M", definition: "Significant, separately identifiable E/M service by same physician on day of procedure.", commonUse: "New problem identified same day as a minor procedure; MDM must be documented separately." },
  "26":  { name: "Professional Component", definition: "Professional (physician) component of a service that has both professional and technical components.", commonUse: "Radiologist billing for interpretation only when facility owns equipment." },
  "50":  { name: "Bilateral Procedure", definition: "Procedure performed bilaterally during same operative session.", commonUse: "Same procedure performed on both sides (e.g., bilateral knee injections)." },
  "51":  { name: "Multiple Procedures", definition: "Multiple procedures other than E/M performed at same session by same provider.", commonUse: "Secondary procedures on same day; payer applies payment reduction (typically 50%)." },
  "57":  { name: "Decision for Surgery (E/M)", definition: "E/M service resulted in initial decision to perform surgery.", commonUse: "Required for Medicare when E/M on day before or day of major (90-day global) surgery." },
  "58":  { name: "Staged or Related Procedure", definition: "Performance of procedure during post-op period was staged, planned prospectively, or more extensive than original procedure.", commonUse: "Planned second-stage procedure in global period." },
  "59":  { name: "Distinct Procedural Service", definition: "Procedure or service is distinct or independent from other services performed on same day.", commonUse: "Unbundling NCCI edits when procedures are truly distinct. Prefer X-modifiers (XE/XS/XP/XU) for Medicare." },
  "62":  { name: "Two Surgeons", definition: "Two surgeons work together as primary surgeons performing distinct parts of a procedure.", commonUse: "Complex spine cases requiring anterior and posterior approach by different surgeons." },
  "LT":  { name: "Left Side", definition: "Service performed on left side of body.", commonUse: "Required for all unilateral musculoskeletal procedures." },
  "RT":  { name: "Right Side", definition: "Service performed on right side of body.", commonUse: "Required for all unilateral musculoskeletal procedures." },
  "TC":  { name: "Technical Component", definition: "Technical component only (equipment, staff, facility resources).", commonUse: "Facility billing for technical portion of imaging when radiologist bills professional component separately." },
  "XE":  { name: "Separate Encounter (NCCI)", definition: "Service is distinct because it was performed during a separate encounter.", commonUse: "Medicare preferred alternative to -59 when procedures were at different encounters." },
  "XS":  { name: "Separate Structure (NCCI)", definition: "Service is distinct because it was performed on a separate organ or structure.", commonUse: "Medicare preferred alternative to -59 when procedures involved separate anatomical structures." },
  "XP":  { name: "Separate Practitioner (NCCI)", definition: "Service is distinct because it was performed by a different practitioner.", commonUse: "Medicare preferred alternative to -59 for different provider." },
  "XU":  { name: "Unusual Non-Overlapping Service (NCCI)", definition: "Service is distinct because it does not overlap with the usual components of the main service.", commonUse: "Medicare preferred alternative to -59 for unusual non-overlapping services." },
  "79":  { name: "Unrelated Procedure During Post-op Period", definition: "Procedure performed during post-op period is unrelated to original procedure.", commonUse: "New unrelated procedure during existing global period." },
  "78":  { name: "Unplanned Return to OR", definition: "Unplanned return to operating room by same physician following initial procedure.", commonUse: "Complication requiring return to OR during global period." },
  "80":  { name: "Assistant Surgeon", definition: "Services of assistant surgeon.", commonUse: "When a second physician assists in the procedure." },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Look up a CPT code, trying both with and without leading '+' */
export function lookupCpt(code: string): CptInfo | null {
  if (!code) return null;
  const clean = code.replace(/^[+]/, "").trim();
  return CPT_REFERENCE[clean] ?? CPT_REFERENCE[`+${clean}`] ?? null;
}

/** Look up a modifier, stripping leading '-' if present */
export function lookupModifier(code: string): ModifierInfo | null {
  if (!code) return null;
  const clean = code.replace(/^[-]/, "").trim().toUpperCase();
  return MODIFIER_REFERENCE[clean] ?? null;
}
