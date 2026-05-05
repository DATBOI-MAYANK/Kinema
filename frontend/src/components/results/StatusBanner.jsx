import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useRegressionData } from "../../hooks/useRegressionData";

export default function StatusBanner() {
	const { error, analyzedData } = useRegressionData();

	if (error) {
		return (
			<div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
				<AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
				<div>
					<p className="text-red-400 font-semibold">Error</p>
					<p className="text-red-300 text-sm mt-1">{error}</p>
				</div>
			</div>
		);
	}

	if (!analyzedData) return null;

	return (
		<div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
			<div className="flex items-start gap-3">
				<CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
				<div className="flex-1">
					<p className="text-green-400 font-semibold">Analysis Complete</p>
					<div className="mt-2 grid grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-slate-400">Total Rows:</span>
							<span className="ml-2 text-slate-200 font-semibold">
								{analyzedData.stats.total}
							</span>
						</div>
						<div>
							<span className="text-slate-400">Valid:</span>
							<span className="ml-2 text-green-400 font-semibold">
								{analyzedData.stats.valid}
							</span>
						</div>
						<div>
							<span className="text-slate-400">Rejected:</span>
							<span className="ml-2 text-red-400 font-semibold">
								{analyzedData.stats.rejected}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

