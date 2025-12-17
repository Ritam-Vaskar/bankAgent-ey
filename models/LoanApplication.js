import mongoose from "mongoose"

const LoanApplicationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		panNo: {
			type: String,
			required: true,
		},
		loanType: {
			type: String,
			required: true,
		},
		eligibleAmount: {
			type: Number,
			required: true,
		},
		annualInterestRate: {
			type: Number,
			required: true,
		},
		tenureMonths: {
			type: Number,
			required: true,
		},
		estimatedEmi: {
			type: Number,
			required: true,
		},
		monthlyIncome: {
			type: Number,
			required: true,
		},
		applicationStatus: {
			type: String,
			enum: ["pending", "approved", "rejected", "under_review"],
			default: "pending",
		},
		appliedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
)

export default mongoose.models.LoanApplication || mongoose.model("LoanApplication", LoanApplicationSchema)
