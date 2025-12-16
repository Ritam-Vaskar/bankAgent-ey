import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

async function findAccountsByPan(pan) {
	const registryPath = path.join(process.cwd(), "public", "data_json", "bank_account.json")
	const raw = await fs.readFile(registryPath, "utf-8")
	const registry = JSON.parse(raw)
	const normalized = (pan || "").toUpperCase().trim()
	const accounts = (registry.entries || []).filter(
		(e) => (e.pan || "").toUpperCase().trim() === normalized,
	)
	const totalAmount = accounts.reduce((sum, acc) => sum + (typeof acc.amount === 'number' ? acc.amount : 0), 0)
	return { accounts, totalAmount }
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
			// fallback: try reading as text and parse simple key=value
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

		const { accounts, totalAmount } = await findAccountsByPan(pan)
		if (!accounts || accounts.length === 0) {
			return NextResponse.json(
				{ error: "No accounts found for PAN", errorCode: "REGISTRY_MISS" },
				{ status: 404 },
			)
		}

		return NextResponse.json({
			success: true,
			ok: true,
			pan: pan.toUpperCase().trim(),
			count: accounts.length,
			totalAmount,
			currency: "INR",
			accounts,
			primaryAccount: accounts[0],
		})
	} catch (err) {
		console.error("[v0] Bank details POST failed:", err)
		return NextResponse.json(
			{ error: "Failed to fetch bank details", errorCode: "REGISTRY_ERROR", details: err.message },
			{ status: 500 },
		)
	}
}

