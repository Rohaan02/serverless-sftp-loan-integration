const getBorrowerName = (data, reversed = false) => {
  const first = getValueFromPath(data, "firstName");
  const last = getValueFromPath(data, "lastName");
  const parts = reversed ? [last, first] : [first, last];
  return parts.filter(Boolean).join(reversed ? ", " : " ");
};

const ficsKeyMapping = {
  // loan
  loan: {
    loan_type: "loanType.name",
    loan_interest_type: "program.programRateType.name",
    loan_payment_type: "program.programRateType.name",
    loan_term: "term",
    loan_rem_term: "term",
    property_address: "subjectPropertyAddress.street",
    property_city: "subjectPropertyAddress.city",
    property_state: "subjectPropertyAddress.state",
    property_zip: "subjectPropertyAddress.zipCode",
    property_county: "subjectPropertyAddress.county" || null,
    legal_description: null,
    property_type: "propertyType.name",
    property_units: "units",
    appraised_value: "appraisalValue",
    Occupancy: "occupancy.name",
    orig_ltv: "ltvRatioPercent",
    orig_appraised_value: "appraisalValue",
    originator: "assignments.loanOfficer.name",
    debt_ratio: ["frontDti", "backDti"],
    loan_name: (data) => getBorrowerName(data, true),
    pa_loan_id: "loanNumber",
    max_balance: "loanAmount",
    ti_disc_stop_id: "additional.generalInformation.escrowWaiver",
  },
  // borrowers
  borrowers: {
    loop: "borrowers",
    fields: {
      borrower_name: (data) => getBorrowerName(data),
      borrower_first: "firstName",
      borrower_middle: "middleName" || null,
      borrower_last: "lastName",
      borrower_suffix: null,
      ssn_tax_id: "ssn",
      borrower_phone: "contacts.homePhone",
      borrower_bus_phone: "contacts.workPhone",
      borrower_credit_score: null,
      email_address: "contacts.email",
      borrower_cell_phone: "contacts.mobilePhone",
      date_of_birth: "birthDate",
      corr_name: (data) => getBorrowerName(data),
      corr_address_1: "currentAddress.street",
      corr_address_2: "currentAddress.street",
      corr_city: "currentAddress.city",
      corr_state: "currentAddress.state",
      corr_zip: "currentAddress.zipCode",
      fico_score_1: "",
      fico_score_2: "",
      fico_score_3: "",
    },
  },
  // dates
  dates: {
    appraised_date: "dates.appraisalDelivered",
  },
  // TaxInsurancePayment
  tax_insurance_payment: {
    first_mortgage: "",
    other_finance: "",
    hazard_insurance: "",
    property_tax: "",
    mortgage_insurance: "",
    hoa: "",
    other: "",
  },

  // Hmda
  hmda: {
    census_tract: null,
  },

  // FloodCertificateDetail
  flood_certificate_detail: {
    flood_zone: "",
    flood_zone_det_date: "",
    map_panel_num: "",
    map_panel_num_eff_date: "",
    community_number: "",
    flood_ins_coverage_amt: "",
    flood_cert_number: "",
  },

  // Hazard Insurance Detail
  hazard_insurance_detail: {
    haz_ins_policy_amt: "",
  },

  // Program
  program: {
    assumable_yn: null,
    margin_pct: "",
    max_rate: "",
    min_rate: "",
    first_max_rate: "",
    first_min_rate: "",
  },

  // Mortgage Insurance Detail
  mortgage_insurance_detail: {
    pmi_mip_automation_cd: "",
    pmi_cert_number: "",
    premium_amount: "",
    coverage_effective_date: "",
  },

  // CustomFields --- you can add  these as individual fields in the XML
  custom_fields: {
    can_loan_be_sold: "",
    inv_cd: "",
    qual_std_desc_id: "",
    member_number: "",
    yrs_before_first_chg: "",
    original_index: "",
    current_index: "",
  },
};

// Utility to extract nested value
function getValueFromPath(obj, path) {
  if (!path) return "";
  const parts = path.split(".");
  let value = obj;
  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = value[part];
    } else {
      return "";
    }
  }
  return value ?? "";
}

function sanitize(str) {
  return str.replace(/[^a-zA-Z0-9_:-]/g, "_");
}

function transformToXML(data, path) {
  if (!path) return "";
  if (typeof path === "function") return path(data);
  if (Array.isArray(path)) {
    return path.map((p) => getValueFromPath(data, p)).join(" / ");
  }
  if (typeof path === "string") return getValueFromPath(data, path);
  return "";
}

module.exports = { ficsKeyMapping, transformToXML, sanitize, getValueFromPath };
