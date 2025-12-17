import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

async function readJson(relPath) {
	const p = path.join(process.cwd(), relPath)
	const raw = await fs.readFile(p, "utf-8")
	return JSON.parse(raw)
}

async function getBankTotalsByPan(pan) {
	try {
		const data = await readJson("public/data_json/bank_account.json")
		const normalized = (pan || "").toUpperCase().trim()
		const accounts = (data.entries || []).filter(e => (e.pan || "").toUpperCase().trim() === normalized)
		const totalAmount = accounts.reduce((s, a) => s + (typeof a.amount === 'number' ? a.amount : 0), 0)
		return { totalAmount, accounts }
	} catch (e) {
		return { totalAmount: 0, accounts: [], error: e }
	}
}

async function getLoanSummaryByPan(pan) {
	try {
		const data = await readJson("public/data_json/loan_history.json")
		const normalized = (pan || "").toUpperCase().trim()
		const loans = (data.entries || []).filter(e => (e.pan || "").toUpperCase().trim() === normalized)
		const sum = (arr, key) => arr.reduce((n, x) => n + (typeof x[key] === 'number' ? x[key] : 0), 0)
		const active = loans.filter(l => (l.currentStatus || '').toLowerCase() === 'active')
		const closed = loans.filter(l => (l.currentStatus || '').toLowerCase() === 'closed')
		const overdue = loans.filter(l => (l.currentStatus || '').toLowerCase() === 'overdue')
		const totalLoanAmount = sum(loans, 'loanAmount')
		const totalPaidAmount = sum(loans, 'currentAmountPaid')
		const totalOutstanding = Math.max(0, totalLoanAmount - totalPaidAmount)
		return {
			loans,
			counts: { all: loans.length, active: active.length, closed: closed.length, overdue: overdue.length },
			totals: { totalLoanAmount, totalPaidAmount, totalOutstanding },
		}
	} catch (e) {
		return { loans: [], counts: { all: 0, active: 0, closed: 0, overdue: 0 }, totals: { totalLoanAmount: 0, totalPaidAmount: 0, totalOutstanding: 0 }, error: e }
	}
}

function deriveIncomeNumbers(income = {}) {
	const toNum = v => {
		if (v === null || v === undefined || v === '') return null
		if (typeof v === 'number') return v
		if (typeof v === 'string') {
			const cleaned = v.replace(/[^0-9.\-]/g, '')
			const num = Number(cleaned)
			return Number.isFinite(num) ? num : null
		}
		return null
	}

	const monthlyNet = toNum(income.monthlyNetSalary)
	const monthlyGross = toNum(income.monthlyGrossSalary)
	const annualNet = toNum(income.annualNetIncome)
	const annualGross = toNum(income.annualGrossIncome)
	const gstTurnover = toNum(income.gstTurnover)

	let resolvedMonthlyNet = monthlyNet
	if (resolvedMonthlyNet == null && annualNet != null) resolvedMonthlyNet = annualNet / 12
	if (resolvedMonthlyNet == null && monthlyGross != null) resolvedMonthlyNet = monthlyGross * 0.8 // rough net from gross
	if (resolvedMonthlyNet == null && annualGross != null) resolvedMonthlyNet = (annualGross * 0.8) / 12

	let resolvedAnnualIncome = annualNet
	if (resolvedAnnualIncome == null && resolvedMonthlyNet != null) resolvedAnnualIncome = resolvedMonthlyNet * 12
	if (resolvedAnnualIncome == null && annualGross != null) resolvedAnnualIncome = annualGross * 0.8
	if (resolvedAnnualIncome == null && gstTurnover != null) resolvedAnnualIncome = gstTurnover * 0.1 // proxy for profit

	return {
		monthlyNet: resolvedMonthlyNet || 0,
		annualIncome: resolvedAnnualIncome || 0,
		gstTurnover: gstTurnover || 0,
	}
}

function emiFor(principal, annualRatePct, tenureMonths) {
	const r = (annualRatePct / 12) / 100
	if (r === 0) return principal / tenureMonths
	const x = Math.pow(1 + r, tenureMonths)
	return (principal * r * x) / (x - 1)
}

function eligiblePrincipal(maxEmi, annualRatePct, tenureMonths) {
	// Inverse EMI approximately by binary search
	let low = 0, high = 1e9
	for (let i = 0; i < 40; i++) {
		const mid = (low + high) / 2
		const e = emiFor(mid, annualRatePct, tenureMonths)
		if (e > maxEmi) high = mid; else low = mid
	}
	return Math.floor(low)
}

function buildRecommendations(income, bankTotal, loanSummary) {
	const monthlyNet = income.monthlyNet
	const annualIncome = income.annualIncome
	const outstanding = loanSummary.totals.totalOutstanding
	const riskReasons = []
	let riskFactor = 1.0

	if (loanSummary.counts.overdue > 0) { riskFactor *= 0.7; riskReasons.push("Overdue loans present") }
	if (loanSummary.counts.active > 2) { riskFactor *= 0.85; riskReasons.push("Multiple active loans") }
	if (outstanding > annualIncome) { riskFactor *= 0.6; riskReasons.push("Outstanding exceeds annual income") }

	const options = []

	const pushOption = (type, rate, tenureYears, emiShare, caps = {}) => {
		const tenureMonths = tenureYears * 12
		const maxEmi = monthlyNet * emiShare
		let principal = eligiblePrincipal(maxEmi, rate, tenureMonths)
		if (caps.maxByIncome) principal = Math.min(principal, annualIncome * caps.maxByIncome)
		if (caps.maxByBank) principal = Math.min(principal, bankTotal * caps.maxByBank)
		principal = Math.max(0, principal * riskFactor)
		const emi = emiFor(principal, rate, tenureMonths)
		options.push({
			type,
			eligibleAmount: Math.round(principal),
			estimatedEmi: Math.round(emi),
			annualInterestRate: rate,
			tenureMonths,
			assumptions: {
				emiShare, riskFactor, reasons: riskReasons,
				caps,
			}
		})
	}

	if (monthlyNet > 0) {
		// Home Loan: 40% EMI share, 20 yrs, rate 9.0%, cap 4x income and up to 90% of bank balance as downpayment support
		pushOption("home", 9.0, 20, 0.40, { maxByIncome: 4.0, maxByBank: 0.90 })
		// Personal Loan: 30% EMI share, 5 yrs, 14%
		pushOption("personal", 14.0, 5, 0.30, { maxByIncome: 0.8 })
		// Education Loan: 25% EMI share, 7 yrs, 11%, cap 2x income
		pushOption("education", 11.0, 7, 0.25, { maxByIncome: 2.0 })
		// Car Loan: 25% EMI share, 7 yrs, 10%, cap 1.5x income
		pushOption("car", 10.0, 7, 0.25, { maxByIncome: 1.5 })
		// Business Loan: if GST turnover exists, allow up to 15% of turnover
		if (income.gstTurnover > 0) {
			const amt = Math.min(income.gstTurnover * 0.15, annualIncome * 1.0)
			options.push({
				type: "business",
				eligibleAmount: Math.round(Math.max(0, amt * riskFactor)),
				annualInterestRate: 13.0,
				tenureMonths: 48,
				estimatedEmi: Math.round(emiFor(Math.max(0, amt * riskFactor), 13.0, 48)),
				assumptions: { riskFactor, reasons: riskReasons, cap: "15% of GST turnover, <= annual income" }
			})
		}
	}

	return options.sort((a,b) => b.eligibleAmount - a.eligibleAmount)
}

async function handle(payload) {
	const pan = (payload.pan || '').toUpperCase().trim()
	const income = deriveIncomeNumbers(payload.income || {})

	let bank = { totalAmount: 0, accounts: [] }
	let loans = { counts: { all: 0, active: 0, closed: 0, overdue: 0 }, totals: { totalLoanAmount: 0, totalPaidAmount: 0, totalOutstanding: 0 }, loans: [] }
	if (pan) {
		bank = await getBankTotalsByPan(pan)
		loans = await getLoanSummaryByPan(pan)
	}

	const recommendations = buildRecommendations(income, bank.totalAmount || 0, loans)

	return NextResponse.json({
		success: true,
		ok: true,
		pan: pan || null,
		inputs: {
			monthlyNet: income.monthlyNet,
			annualIncome: income.annualIncome,
			bankTotal: bank.totalAmount || 0,
			loanCounts: loans.counts,
			loanTotals: loans.totals,
		},
		recommendations,
		currency: "INR",
	})
}

export async function POST(req) {
	try {
		const body = await req.json()
		return await handle(body || {})
	} catch (err) {
		console.error("[v0] loan_details POST failed:", err)
		return NextResponse.json({ error: "Failed to compute loan details", errorCode: "COMPUTE_FAILED", details: err.message }, { status: 500 })
	}
}
// POST-only endpoint. Use POST with body: { pan?, income: { monthlyNetSalary?, annualNetIncome?, gstTurnover? } }

