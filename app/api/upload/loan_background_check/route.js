import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

async function getLoansByPan(pan) {
	const registryPath = path.join(process.cwd(), "public", "data_json", "loan_history.json")
	const raw = await fs.readFile(registryPath, "utf-8")
	const registry = JSON.parse(raw)
	const normalized = (pan || "").toUpperCase().trim()
	const loans = (registry.entries || []).filter(
		(e) => (e.pan || "").toUpperCase().trim() === normalized,
	)

	const group = {
		active: [],
		closed: [],
		overdue: [],
	}

	for (const loan of loans) {
		const status = (loan.currentStatus || "").toLowerCase()
		if (status === "closed") group.closed.push(loan)
		else if (status === "overdue") group.overdue.push(loan)
		else group.active.push(loan)
	}

	const sum = (arr, key) => arr.reduce((n, x) => n + (typeof x[key] === 'number' ? x[key] : 0), 0)

	const totals = {
		allCount: loans.length,
		activeCount: group.active.length,
		closedCount: group.closed.length,
		overdueCount: group.overdue.length,
		totalLoanAmount: sum(loans, 'loanAmount'),
		totalPaidAmount: sum(loans, 'currentAmountPaid'),
	}
	totals.totalOutstanding = Math.max(0, totals.totalLoanAmount - totals.totalPaidAmount)

	return { loans, group, totals }
}

// POST-only endpoint. Use POST with body: { pan }

export async function POST(req) {
	try {
		let pan = null
		const contentType = req.headers.get("content-type") || ""
		if (contentType.includes("application/json")) {
			const body = await req.json()
			pan = body?.pan
		} else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
			const form = await req.formData()
			pan = form.get("pan")
		} else {
			const text = await req.text()
			const m = text.match(/pan=([^&\n]+)/i)
			if (m) pan = decodeURIComponent(m[1])
		}

		if (!pan) {
			return NextResponse.json(
				{ error: "Missing 'pan' in request body" },
				{ status: 400 },
			)
		}

		const { loans, group, totals } = await getLoansByPan(pan)
		if (!loans || loans.length === 0) {
			return NextResponse.json(
				{ error: "No loan history found for PAN", errorCode: "REGISTRY_MISS" },
				{ status: 404 },
			)
		}

		return NextResponse.json({
			success: true,
			ok: true,
			pan: pan.toUpperCase().trim(),
			totals,
			group,
			loans,
			currency: "INR",
		})
	} catch (err) {
		console.error("[v0] Loan background POST failed:", err)
		return NextResponse.json(
			{ error: "Failed to fetch loan history", errorCode: "REGISTRY_ERROR", details: err.message },
			{ status: 500 },
		)
	}
}

