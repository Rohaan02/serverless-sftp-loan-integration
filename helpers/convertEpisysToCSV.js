const episysKeyMapping = {
  // Field Name
  borrower_1_name: (data) => {
    const b = data.borrowers?.[0];
    if (!b) return "";
    return [b.firstName, b.lastName].join(" ");
  },

  // loan
  loan_amount: "loanAmount",
  loan_number: "loanNumber",

  // dates
  dates_funded: "dates.funded",

  // disclosure
  disclosure_initial_escrow_payment_at_closing: "",
  disclosure_lender_credit: "disclosure.serviceProviders.lenderCredit",
  disclosure_prepaid_interest: "",
  disclosure_processing_fee_to_lender_at_closing: "",
  disclosure_tax_related_service_fee: "",
  disclosure_underwriting_fee_to_lender_at_closing:
    "disclosure.serviceProviders.fees.underwritingFee",

  // custom_fields
  cf_share_account_cash_to_from_closing_instruction: "",
  cf_share_account_cash_to_from_closing_suffix: "",
  cf_balancing_appraisal_fee: "",
  cf_balancing_calculate_wire: "",
  cf_balancing_cash_from_close: "",
  cf_balancing_cash_to_closing: "",
  cf_balancing_credit_report: "",
  cf_balancing_discount_points: "",
  cf_balancing_document_prep_fee: "",
  cf_balancing_eoi_direct_fee: "",
  cf_balancing_flood: "",
  cf_balancing_ga_res_fee: "",
  cf_balancing_insurance_tracking: "",
  cf_balancing_principal_reduction: "",
  cf_balancing_promo_lender_credit: "",
  cf_balancing_rate_lock_fees_total: "",
  cf_balancing_reconveyance: "",
  cf_balancing_technology: "",
  cf_balancing_wire_credits: "",
  cf_balancing_wire_total: "",
  cf_gl_appraisal_fee: "",
  cf_gl_appraisal_fee_branch: "",
  cf_gl_bundled_fees: "",
  cf_gl_bundled_fees_branch: "",
  cf_gl_bundled_fees_total: "",
  cf_gl_discount_points: "",
  cf_gl_discount_points_branch: "",
  cf_gl_doc_prep_fee: "",
  cf_gl_doc_prep_fee_branch: "",
  cf_gl_eoi_direct_fee: "",
  cf_gl_eoi_direct_fee_branch: "",
  cf_gl_escrow_deposit: "",
  cf_gl_escrow_deposit_branch: "",
  cf_gl_georgia_res_fee: "",
  cf_gl_georgia_res_fee_branch: "",
  cf_gl_lender_credit: "",
  cf_gl_lender_credit_branch: "",
  cf_gl_loan_amount: "",
  cf_gl_loan_amount_branch: "",
  cf_gl_mtg_ins_tracking_fee: "",
  cf_gl_mtg_ins_tracking_fee_branch: "",
  cf_gl_payoffs_proceeds: "",
  cf_gl_payoffs_proceeds_branch: "",
  cf_gl_prepaid_interest: "",
  cf_gl_prepaid_interest_branch: "",
  cf_gl_principal_reduction: "",
  cf_gl_principal_reduction_branch: "",
  cf_gl_processing_fee: "",
  cf_gl_processing_fee_branch: "",
  cf_gl_product_code: "",
  cf_gl_promo_lender_credit: "",
  cf_gl_promo_lender_credit_branch: "",
  cf_gl_rate_option_and_rate_lock: "",
  cf_gl_rate_option_and_rate_lock_branch: "",
  cf_gl_recast_fee: "",
  cf_gl_recast_fee_branch: "",
  cf_gl_reconveyance: "",
  cf_gl_reconveyance_branch: "",
  cf_gl_wire: "",
  cf_gl_wire_branch: "",
  cf_gl_suffix: "",
  cf_member_1_number: "",
  cf_payoff1_to_aafcu_account: "",
  cf_payoff1_to_aafcu_amount: "",
  cf_payoff2_to_aafcu_account: "",
  cf_payoff2_to_aafcu_amount: "",
  cf_payoff3_to_aafcu_account: "",
  cf_payoff3_to_aafcu_amount: "",
};

// Utility to extract nested value (for non-borrower fields)
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

function transformToCSV(data, mapping) {
  const row = {};
  for (const [field, pathOrFn] of Object.entries(mapping)) {
    if (typeof pathOrFn === "function") {
      row[field] = pathOrFn(data);
    } else if (Array.isArray(pathOrFn)) {
      row[field] = pathOrFn.map((p) => getValueFromPath(data, p)).join(" / ");
    } else if (typeof pathOrFn === "string") {
      row[field] = getValueFromPath(data, pathOrFn);
    } else {
      row[field] = "";
    }
  }
  return row;
}

module.exports = { episysKeyMapping, transformToCSV };
